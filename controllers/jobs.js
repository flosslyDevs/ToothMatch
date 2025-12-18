import { LocumShift, PermanentJob, User, PracticeProfile, PracticeLocation, PracticeMedia, JobPreference, CandidateProfile, Media } from '../models/index.js';
import { Op } from 'sequelize';

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
	const R = 3959; // Earth's radius in miles
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLon = (lon2 - lon1) * Math.PI / 180;
	const a = 
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c; // Distance in miles
}

// Get all jobs (both locum shifts and permanent jobs) for a specific practitioner
export async function getPractitionerJobs(req, res) {
	const { practitionerId } = req.params;
	
	try {
		// Get locum shifts for the practitioner
		const locumShifts = await LocumShift.findAll({
			where: { 
				userId: practitionerId,
				status: 'active' // Only active shifts
			},
			include: [
				{
					model: User,
					attributes: ['id', 'fullName', 'email']
				},
				{
					model: PracticeProfile,
					attributes: ['clinicType', 'website', 'phoneNumber']
				}
			],
			order: [['createdAt', 'DESC']]
		});

		// Get permanent jobs for the practitioner
		const permanentJobs = await PermanentJob.findAll({
			where: { 
				userId: practitionerId,
				status: 'active' // Only active jobs
			},
			include: [
				{
					model: User,
					attributes: ['id', 'fullName', 'email']
				},
				{
					model: PracticeProfile,
					attributes: ['clinicType', 'website', 'phoneNumber']
				}
			],
			order: [['createdAt', 'DESC']]
		});

		// Transform locum shifts to include job type identifier
		const transformedLocumShifts = locumShifts.map(shift => {
			const shiftData = shift.toJSON();
			// Remove the original User and PracticeProfile objects to avoid duplicates
			delete shiftData.User;
			delete shiftData.PracticeProfile;
			return {
				...shiftData,
				jobType: 'locum',
				jobTypeLabel: 'Locum Shift',
				user: shift.User,
				practiceProfile: shift.PracticeProfile
			};
		});

		// Transform permanent jobs to include job type identifier
		const transformedPermanentJobs = permanentJobs.map(job => {
			const jobData = job.toJSON();
			// Remove the original User and PracticeProfile objects to avoid duplicates
			delete jobData.User;
			delete jobData.PracticeProfile;
			return {
				...jobData,
				jobType: 'permanent',
				jobTypeLabel: 'Permanent Job',
				user: job.User,
				practiceProfile: job.PracticeProfile
			};
		});

		// Combine both types of jobs
		const allJobs = [...transformedLocumShifts, ...transformedPermanentJobs];

		// Sort by creation date (newest first)
		allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

		return res.status(200).json({
			success: true,
			data: {
				practitionerId,
				totalJobs: allJobs.length,
				locumShifts: transformedLocumShifts.length,
				permanentJobs: transformedPermanentJobs.length,
				jobs: allJobs
			}
		});

	} catch (error) {
		return res.status(500).json({
			success: false,
			message: 'Error fetching practitioner jobs',
			error: error.message
		});
	}
}

// Get all active jobs (both locum shifts and permanent jobs) - public endpoint
export async function getAllActiveJobs(req, res) {
	try {
		// Get all active locum shifts
        const locumShifts = await LocumShift.findAll({
			where: { status: 'active' },
			include: [
				{
					model: User,
					attributes: ['id', 'fullName', 'email']
				},
                {
                    model: PracticeProfile,
                    attributes: ['clinicType', 'website', 'phoneNumber'],
                    required: false,
                    include: [
                        {
                            model: PracticeMedia,
                            attributes: ['kind', 'url'],
                            required: false
                        }
                    ]
                }
			],
			order: [['createdAt', 'DESC']]
		});

		// Get all active permanent jobs
        const permanentJobs = await PermanentJob.findAll({
			where: { status: 'active' },
			include: [
				{
					model: User,
					attributes: ['id', 'fullName', 'email']
				},
                {
                    model: PracticeProfile,
                    attributes: ['clinicType', 'website', 'phoneNumber'],
                    required: false,
                    include: [
                        {
                            model: PracticeMedia,
                            attributes: ['kind', 'url'],
                            required: false
                        }
                    ]
                }
			],
			order: [['createdAt', 'DESC']]
		});

		// Transform locum shifts to include job type identifier
        const transformedLocumShifts = locumShifts.map(shift => {
			const shiftData = shift.toJSON();
			// Remove the original User and PracticeProfile objects to avoid duplicates
			delete shiftData.User;
			delete shiftData.PracticeProfile;
            // derive avatar from practice media if available (prefer 'logo')
            let avatar = null;
            const pp = shift.PracticeProfile;
            if (pp && pp.PracticeMedia && Array.isArray(pp.PracticeMedia)) {
                const logo = pp.PracticeMedia.find(m => (m.kind || '').toLowerCase() === 'logo');
                const any = pp.PracticeMedia[0];
                avatar = logo ? logo.url : (any ? any.url : null);
            }
            const practiceProfile = {
                clinicType: pp?.clinicType ?? null,
                website: pp?.website ?? null,
                phoneNumber: pp?.phoneNumber ?? null,
                PracticeMedia: Array.isArray(pp?.PracticeMedia) ? pp.PracticeMedia : [],
                avatar
            };
            return {
                ...shiftData,
                jobType: 'locum',
                jobTypeLabel: 'Locum Shift',
                user: shift.User,
                practiceProfile
            };
		});

		// Transform permanent jobs to include job type identifier
        const transformedPermanentJobs = permanentJobs.map(job => {
			const jobData = job.toJSON();
			// Remove the original User and PracticeProfile objects to avoid duplicates
			delete jobData.User;
			delete jobData.PracticeProfile;
            let avatar = null;
            const pp = job.PracticeProfile;
            if (pp && pp.PracticeMedia && Array.isArray(pp.PracticeMedia)) {
                const logo = pp.PracticeMedia.find(m => (m.kind || '').toLowerCase() === 'logo');
                const any = pp.PracticeMedia[0];
                avatar = logo ? logo.url : (any ? any.url : null);
            }
            const practiceProfile = {
                clinicType: pp?.clinicType ?? null,
                website: pp?.website ?? null,
                phoneNumber: pp?.phoneNumber ?? null,
                PracticeMedia: Array.isArray(pp?.PracticeMedia) ? pp.PracticeMedia : [],
                avatar
            };
            return {
                ...jobData,
                jobType: 'permanent',
                jobTypeLabel: 'Permanent Job',
                user: job.User,
                practiceProfile
            };
		});

		// Combine both types of jobs
		const allJobs = [...transformedLocumShifts, ...transformedPermanentJobs];

		// Sort by creation date (newest first)
		allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

		return res.status(200).json({
			success: true,
			data: {
				totalJobs: allJobs.length,
				locumShifts: transformedLocumShifts.length,
				permanentJobs: transformedPermanentJobs.length,
				jobs: allJobs
			}
		});

	} catch (error) {
		return res.status(500).json({
			success: false,
			message: 'Error fetching all jobs',
			error: error.message
		});
	}
}

// Filter jobs for candidates with multiple filter options
export async function filterJobsForCandidates(req, res) {
	try {
		const parseTimeToMinutes = (value) => {
			if (!value || typeof value !== 'string') return null;
			// Capture the first time token (e.g., "9 AM", "09:00", "09:00:00 PM") to support ranges like "9 AM - 5 PM"
			const match = value.match(/(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(AM|PM)/i);
			if (!match) return null;

			let hour = parseInt(match[1], 10);
			const minute = match[2] ? parseInt(match[2], 10) : 0;
			if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

			const period = match[4].toLowerCase();
			hour = (hour % 12) + (period === 'pm' ? 12 : 0);
			return hour * 60 + minute;
		};

		const getShiftLabelFromTime = (value) => {
			const minutes = parseTimeToMinutes(value);
			if (minutes === null) return null;
			const hour = Math.floor(minutes / 60);
			return hour >= 5 && hour < 15 ? 'day-shift' : 'night-shift';
		};

		const {
			jobType, // For permanent jobs: 'part-time', 'full-time', etc.
			workingPattern, // 'day-shift', 'night-shift', etc.
			payRangeMin, // Minimum pay rate (20)
			payRangeMax, // Maximum pay rate (50)
			searchRadius, // Radius in miles (1 to 31)
			salaryPreferenceMin, // Minimum salary preference (10)
			salaryPreferenceMax, // Maximum salary preference (50000)
			candidateLat, // Candidate's latitude for location-based filtering
			candidateLng, // Candidate's longitude for location-based filtering
			page = 1,
			limit = 10
		} = req.query;

		const offset = (parseInt(page) - 1) * parseInt(limit);

		// Build where clause for permanent jobs
		const permanentJobWhere = { status: 'active' };
		
		if (jobType) {
			permanentJobWhere.jobType = { [Op.iLike]: `%${jobType}%` };
		}

		// Build where clause for locum shifts
		const locumShiftWhere = { status: 'active' };

		// Get all active locum shifts with filters
		const allLocumShifts = await LocumShift.findAll({
			where: locumShiftWhere,
			include: [
				{
					model: User,
					attributes: ['id', 'fullName', 'email']
				},
				{
					model: PracticeProfile,
					attributes: ['clinicType', 'website', 'phoneNumber'],
					required: false,
					include: [
						{
							model: PracticeMedia,
							attributes: ['kind', 'url'],
							required: false
						}
					]
				}
			]
		});

		// Get all active permanent jobs with filters
		const allPermanentJobs = await PermanentJob.findAll({
			where: permanentJobWhere,
			include: [
				{
					model: User,
					attributes: ['id', 'fullName', 'email']
				},
				{
					model: PracticeProfile,
					attributes: ['clinicType', 'website', 'phoneNumber'],
					required: false,
					include: [
						{
							model: PracticeMedia,
							attributes: ['kind', 'url'],
							required: false
						}
					]
				}
			]
		});

		// Filter locum shifts by pay range (hourlyRate or dayRate)
		let filteredLocumShifts = allLocumShifts.filter(shift => {
			let passesPayFilter = true;
			
			if (payRangeMin || payRangeMax) {
				const minPay = parseFloat(payRangeMin) || 0;
				const maxPay = parseFloat(payRangeMax) || Infinity;
				
				const hourlyRate = parseFloat(shift.hourlyRate) || 0;
				const dayRate = parseFloat(shift.dayRate) || 0;
				
				// Check if hourlyRate or dayRate falls within range
				passesPayFilter = (hourlyRate >= minPay && hourlyRate <= maxPay) || 
								  (dayRate >= minPay && dayRate <= maxPay) ||
								  (!hourlyRate && !dayRate); // Include jobs without rate if no rate specified
			}

			if (salaryPreferenceMin || salaryPreferenceMax) {
				const minSalary = parseFloat(salaryPreferenceMin) || 0;
				const maxSalary = parseFloat(salaryPreferenceMax) || Infinity;
				
				const hourlyRate = parseFloat(shift.hourlyRate) || 0;
				const dayRate = parseFloat(shift.dayRate) || 0;
				
				const passesSalaryFilter = (hourlyRate >= minSalary && hourlyRate <= maxSalary) || 
										  (dayRate >= minSalary && dayRate <= maxSalary) ||
										  (!hourlyRate && !dayRate);
				
				passesPayFilter = passesPayFilter && passesSalaryFilter;
			}

			// Filter by working pattern (time field)
			if (workingPattern) {
				const desiredPattern = workingPattern.toLowerCase();
				const shiftLabel = getShiftLabelFromTime(shift.time);
				if (shiftLabel) {
					if (desiredPattern === 'day-shift' && shiftLabel !== 'day-shift') return false;
					if (desiredPattern === 'night-shift' && shiftLabel !== 'night-shift') return false;
				} else {
					const timeLower = (shift.time || '').toLowerCase();
					if (desiredPattern === 'day-shift') {
						if (!timeLower.includes('day') && !timeLower.includes('morning') && !timeLower.includes('afternoon')) {
							return false;
						}
					} else if (desiredPattern === 'night-shift') {
						if (!timeLower.includes('night') && !timeLower.includes('evening')) {
							return false;
						}
					}
				}
			}

			return passesPayFilter;
		});

		// Filter permanent jobs by salary range
		let filteredPermanentJobs = allPermanentJobs.filter(job => {
			let passesSalaryFilter = true;

			if (salaryPreferenceMin || salaryPreferenceMax || payRangeMin || payRangeMax) {
				const minValue = Math.min(
					parseFloat(salaryPreferenceMin) || 0,
					parseFloat(payRangeMin) || 0
				);
				const maxValue = Math.max(
					parseFloat(salaryPreferenceMax) || Infinity,
					parseFloat(payRangeMax) || Infinity
				);

				// Parse salaryRange string (e.g., "£30,000 - £50,000" or "30k-50k")
				const salaryRange = job.salaryRange || '';
				const numbers = salaryRange.match(/[\d,]+/g);
				
				if (numbers && numbers.length > 0) {
					// Extract numeric values and convert to numbers
					const salaryValues = numbers.map(num => {
						const cleanNum = num.replace(/,/g, '');
						return parseFloat(cleanNum);
					}).filter(val => !isNaN(val));

					if (salaryValues.length > 0) {
						const minSalary = Math.min(...salaryValues);
						const maxSalary = Math.max(...salaryValues);
						
						// Check if any part of the range overlaps with filter
						passesSalaryFilter = (minSalary <= maxValue && maxSalary >= minValue);
					} else {
						// If can't parse, include it (no rate specified)
						passesSalaryFilter = true;
					}
				} else {
					// No salary range specified, include it
					passesSalaryFilter = true;
				}
			}

			// Filter by working pattern (workingHours field)
			if (workingPattern) {
				const desiredPattern = workingPattern.toLowerCase();
				const shiftLabel = getShiftLabelFromTime(job.workingHours);
				if (shiftLabel) {
					if (desiredPattern === 'day-shift' && shiftLabel !== 'day-shift') return false;
					if (desiredPattern === 'night-shift' && shiftLabel !== 'night-shift') return false;
				} else {
					const workingHoursLower = (job.workingHours || '').toLowerCase();
					if (desiredPattern === 'day-shift') {
						if (!workingHoursLower.includes('day') && !workingHoursLower.includes('morning') && !workingHoursLower.includes('afternoon')) {
							return false;
						}
					} else if (desiredPattern === 'night-shift') {
						if (!workingHoursLower.includes('night') && !workingHoursLower.includes('evening')) {
							return false;
						}
					}
				}
			}

			return passesSalaryFilter;
		});

		// Apply location-based filtering if coordinates are provided
		if (candidateLat && candidateLng && searchRadius) {
			const candidateLatFloat = parseFloat(candidateLat);
			const candidateLngFloat = parseFloat(candidateLng);
			const radiusFloat = parseFloat(searchRadius);

			// Get all practice locations with coordinates
			const practiceLocations = await PracticeLocation.findAll({
				where: {
					latitude: { [Op.ne]: null },
					longitude: { [Op.ne]: null }
				},
				attributes: ['userId', 'latitude', 'longitude', 'address']
			});

			// Create a map of userId to locations within radius
			const usersWithinRadius = new Set();
			practiceLocations.forEach(loc => {
				const locLat = parseFloat(loc.latitude);
				const locLng = parseFloat(loc.longitude);
				
				if (!isNaN(locLat) && !isNaN(locLng)) {
					const distance = calculateDistance(candidateLatFloat, candidateLngFloat, locLat, locLng);
					if (distance <= radiusFloat) {
						usersWithinRadius.add(loc.userId);
					}
				}
			});

			// Filter jobs by userId (only jobs from practices within radius)
			filteredLocumShifts = filteredLocumShifts.filter(shift => 
				usersWithinRadius.has(shift.userId)
			);
			filteredPermanentJobs = filteredPermanentJobs.filter(job => 
				usersWithinRadius.has(job.userId)
			);
		}

		// Transform locum shifts
		const transformedLocumShifts = filteredLocumShifts.map(shift => {
			const shiftData = shift.toJSON();
			delete shiftData.User;
			delete shiftData.PracticeProfile;

			// derive avatar from practice media if available (prefer 'logo')
			let avatar = null;
			const pp = shift.PracticeProfile;
			if (pp && pp.PracticeMedia && Array.isArray(pp.PracticeMedia)) {
				const logo = pp.PracticeMedia.find(m => (m.kind || '').toLowerCase() === 'logo');
				const any = pp.PracticeMedia[0];
				avatar = logo ? logo.url : (any ? any.url : null);
			}

			const practiceProfile = {
				clinicType: pp?.clinicType ?? null,
				website: pp?.website ?? null,
				phoneNumber: pp?.phoneNumber ?? null,
				avatar
			};

			return {
				...shiftData,
				jobType: 'locum',
				jobTypeLabel: 'Locum Shift',
				user: shift.User,
				practiceProfile
			};
		});

		// Transform permanent jobs
		const transformedPermanentJobs = filteredPermanentJobs.map(job => {
			const jobData = job.toJSON();
			delete jobData.User;
			delete jobData.PracticeProfile;

			// derive avatar from practice media if available (prefer 'logo')
			let avatar = null;
			const pp = job.PracticeProfile;
			if (pp && pp.PracticeMedia && Array.isArray(pp.PracticeMedia)) {
				const logo = pp.PracticeMedia.find(m => (m.kind || '').toLowerCase() === 'logo');
				const any = pp.PracticeMedia[0];
				avatar = logo ? logo.url : (any ? any.url : null);
			}

			const practiceProfile = {
				clinicType: pp?.clinicType ?? null,
				website: pp?.website ?? null,
				phoneNumber: pp?.phoneNumber ?? null,
				avatar
			};

			return {
				...jobData,
				jobType: 'permanent',
				jobTypeLabel: 'Permanent Job',
				user: job.User,
				practiceProfile
			};
		});

		// Combine both types of jobs
		const allJobs = [...transformedLocumShifts, ...transformedPermanentJobs];

		// Sort by creation date (newest first)
		allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

		// Apply pagination
		const paginatedJobs = allJobs.slice(offset, offset + parseInt(limit));

		return res.status(200).json({
			success: true,
			data: {
				totalJobs: allJobs.length,
				locumShifts: transformedLocumShifts.length,
				permanentJobs: transformedPermanentJobs.length,
				jobs: paginatedJobs,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					totalPages: Math.ceil(allJobs.length / parseInt(limit))
				},
				filters: {
					jobType: jobType || null,
					workingPattern: workingPattern || null,
					payRange: payRangeMin || payRangeMax ? { min: payRangeMin, max: payRangeMax } : null,
					searchRadius: searchRadius || null,
					salaryPreference: salaryPreferenceMin || salaryPreferenceMax ? { min: salaryPreferenceMin, max: salaryPreferenceMax } : null
				}
			}
		});

	} catch (error) {
		return res.status(500).json({
			success: false,
			message: 'Error filtering jobs',
			error: error.message
		});
	}
}

// Filter candidates for practices with multiple filter options
export async function filterCandidatesForPractices(req, res) {
    try {
        const {
            jobType, // 'part-time', 'full-time', etc.
            workingPattern, // 'day-shift', 'night-shift', etc.
            payRangeMin, // 20
            payRangeMax, // 50
            salaryPreferenceMin, // 10
            salaryPreferenceMax, // 50000
            searchRadius, // miles
            practiceLat, // practice latitude
            practiceLng, // practice longitude
            page = 1,
            limit = 10
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Fetch candidates with preferences
        const candidates = await CandidateProfile.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id', 'fullName', 'email'],
                    include: [
                        {
                            model: JobPreference,
                            attributes: [
                                'jobType',
                                'workingPattern',
                                'payMin',
                                'payMax',
                                'hourlyRate',
                                'salaryPreference',
                                'latitude',
                                'longitude',
                                'searchRadiusKm'
                            ]
                        },
                        {
                            model: Media,
                            attributes: ['kind', 'url']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // In-memory filter (dataset expected small/medium). For large datasets, move to SQL where.
        let filtered = candidates.filter(c => {
            const pref = (c.User && c.User.JobPreference) ? c.User.JobPreference : {};

            // jobType filter
            if (jobType) {
                if (!pref.jobType || !pref.jobType.toLowerCase().includes(String(jobType).toLowerCase())) return false;
            }

            // workingPattern filter
            if (workingPattern) {
                if (!pref.workingPattern || !pref.workingPattern.toLowerCase().includes(String(workingPattern).toLowerCase())) return false;
            }

            // pay range filter (use payMin/payMax or hourlyRate)
            if (payRangeMin || payRangeMax) {
                const minPay = parseFloat(payRangeMin) || 0;
                const maxPay = parseFloat(payRangeMax) || Infinity;
                const prefMin = Number(pref.payMin) || 0;
                const prefMax = Number(pref.payMax) || 0;
                const hr = Number(pref.hourlyRate) || 0;

                const anyMatch = (
                    (prefMin >= minPay && prefMin <= maxPay) ||
                    (prefMax >= minPay && prefMax <= maxPay) ||
                    (hr >= minPay && hr <= maxPay)
                );
                if (!anyMatch) return false;
            }

            // salary preference filter (parse numeric from salaryPreference string if present)
            if (salaryPreferenceMin || salaryPreferenceMax) {
                const minSal = parseFloat(salaryPreferenceMin) || 0;
                const maxSal = parseFloat(salaryPreferenceMax) || Infinity;

                let values = [];
                if (pref.salaryPreference) {
                    const nums = String(pref.salaryPreference).match(/[\d,]+/g);
                    if (nums) {
                        values = nums.map(n => Number(n.replace(/,/g, ''))).filter(v => !isNaN(v));
                    }
                }

                // Fallback to payMin/payMax if salaryPreference not parsable
                if (values.length === 0) {
                    if (pref.payMin) values.push(Number(pref.payMin));
                    if (pref.payMax) values.push(Number(pref.payMax));
                }

                if (values.length > 0) {
                    const vMin = Math.min(...values);
                    const vMax = Math.max(...values);
                    if (!(vMin <= maxSal && vMax >= minSal)) return false;
                }
            }

            return true;
        });

        // location-based filtering (practice coords vs candidate's pref coords)
        if (practiceLat && practiceLng && searchRadius) {
            const plat = parseFloat(practiceLat);
            const plng = parseFloat(practiceLng);
            const radius = parseFloat(searchRadius);

            filtered = filtered.filter(c => {
                const pref = (c.User && c.User.JobPreference) ? c.User.JobPreference : {};
                const clat = pref.latitude != null ? parseFloat(pref.latitude) : NaN;
                const clng = pref.longitude != null ? parseFloat(pref.longitude) : NaN;
                if (isNaN(clat) || isNaN(clng)) return false;
                const d = calculateDistance(plat, plng, clat, clng);
                return d <= radius;
            });
        }

        const total = filtered.length;
        const paginated = filtered.slice(offset, offset + parseInt(limit));

        // shape response
        const results = paginated.map(c => {
            const json = c.toJSON();
            const userMedia = Array.isArray(json.User?.Media) ? json.User.Media : [];

            // derive avatar from candidate media (prefer 'profile_picture', then 'logo', then first)
            let avatar = null;
            if (userMedia.length > 0) {
                const profilePic = userMedia.find(m => (m.kind || '').toLowerCase() === 'profile_picture');
                const logo = userMedia.find(m => (m.kind || '').toLowerCase() === 'logo');
                avatar = profilePic ? profilePic.url : (logo ? logo.url : null);
            }

            // Strip Media from the nested User object before returning
            const { Media: _ignoredMedia, ...userWithoutMedia } = json.User || {};

            // keep only needed fields
            return {
                id: json.id,
                userId: json.userId,
                fullName: json.fullName,
                jobTitle: json.jobTitle,
                currentStatus: json.currentStatus,
                linkedinUrl: json.linkedinUrl,
                aboutMe: json.aboutMe,
                avatar,
                user: userWithoutMedia,
                preferences: json.User ? json.User.JobPreference : null
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                totalCandidates: total,
                candidates: results,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                },
                filters: {
                    jobType: jobType || null,
                    workingPattern: workingPattern || null,
                    payRange: payRangeMin || payRangeMax ? { min: payRangeMin, max: payRangeMax } : null,
                    salaryPreference: salaryPreferenceMin || salaryPreferenceMax ? { min: salaryPreferenceMin, max: salaryPreferenceMax } : null,
                    searchRadius: practiceLat && practiceLng && searchRadius ? { miles: searchRadius, practiceLat, practiceLng } : null
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error filtering candidates',
            error: error.message
        });
    }
}

// Activate a job
export async function activateJob(req, res) {
	const { jobId } = req.params;
	const userId = req.user.sub;
	try {
		const job = await PermanentJob.findByPk(jobId);
		if (!job) {
			const locum = await LocumShift.findByPk(jobId);
			if (!locum) {
				return res.status(404).json({ message: 'Job not found' });
			}
			if (locum.userId !== userId) {
				return res.status(403).json({ message: 'You are not authorized to activate this job' });
			}
			if (locum.status === 'active') {
				return res.status(400).json({ message: 'Job is already active' });
			}
			await locum.update({ status: 'active' });
			return res.status(200).json({ message: 'Job activated successfully', type: 'locum' });
		}
		if (job.userId !== userId) {
			return res.status(403).json({ message: 'You are not authorized to activate this job' });
		}
		if (job.status === 'active') {
			return res.status(400).json({ message: 'Job is already active' });
		}
		await job.update({ status: 'active' });
		return res.status(200).json({ message: 'Job activated successfully', type: 'permanent' });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Pause a job
export async function pauseJob(req, res) {
	const { jobId } = req.params;
	const userId = req.user.sub;
	try {
		const job = await PermanentJob.findByPk(jobId);
		if (!job) {
			const locum = await LocumShift.findByPk(jobId);
			if (!locum) {
				return res.status(404).json({ message: 'Job not found' });
			}
			if (locum.userId !== userId) {
				return res.status(403).json({ message: 'You are not authorized to pause this job' });
			}
			if (locum.status === 'paused') {
				return res.status(400).json({ message: 'Job is already paused' });
			}
			await locum.update({ status: 'paused' });
			return res.status(200).json({ message: 'Job paused successfully', type: 'locum' });
		}
		if (job.userId !== userId) {
			return res.status(403).json({ message: 'You are not authorized to pause this job' });
		}		
		if (job.status === 'paused') {
			return res.status(400).json({ message: 'Job is already paused' });
		}
		await job.update({ status: 'paused' });
		return res.status(200).json({ message: 'Job paused successfully', type: 'permanent' });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}