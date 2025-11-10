import { 
	CandidateProfile, 
	PracticeProfile,
	Education, 
	WorkExperience, 
	WorkPersonality, 
	Skill, 
	Specialization, 
	PracticeMedia,
	PracticeLocation,
	UserSkill, 
	UserSpecialization, 
	Media, 
	IdentityDocument, 
	JobPreference, 
	AvailabilitySlot 
} from '../models/index.js';

// Step 1-2: Basic Profile
export async function createProfile(req, res) {
	const { fullName, gender, jobTitle, currentStatus, linkedinUrl, aboutMe } = req.body;
	const userId = req.user.sub;
	
	try {
		const [profile, created] = await CandidateProfile.findOrCreate({
			where: { userId },
			defaults: { fullName, gender, jobTitle, currentStatus, linkedinUrl, aboutMe, userId }
		});
		
		if (!created) {
			await profile.update({ fullName, gender, jobTitle, currentStatus, linkedinUrl, aboutMe });
		}
		
		return res.status(200).json({ profile });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getProfile(req, res) {
	const userId = req.user.sub;
	
	try {
		const profile = await CandidateProfile.findOne({ where: { userId } });
		return res.status(200).json({ profile });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Step 3: Education
export async function addEducation(req, res) {
	const { highestLevel, institution, fieldOfStudy, startDate, endDate } = req.body;
	const userId = req.user.sub;
	
	try {
		const education = await Education.create({ userId, highestLevel, institution, fieldOfStudy, startDate, endDate });
		return res.status(201).json({ education });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getEducations(req, res) {
	const userId = req.user.sub;
	
	try {
		const educations = await Education.findAll({ where: { userId } });
		return res.status(200).json({ educations });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Step 3: Work Experience
export async function addWorkExperience(req, res) {
	const { company, roleTitle, startDate, endDate, isCurrent, yearsExperience, professionalRegNumber } = req.body;
	const userId = req.user.sub;
	
	try {
		if (!company) {
			return res.status(400).json({ message: 'company is required' });
		}
		const experience = await WorkExperience.create({
			userId, company, roleTitle, startDate, endDate, isCurrent, yearsExperience, professionalRegNumber
		});
		return res.status(201).json({ experience });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getWorkExperiences(req, res) {
	const userId = req.user.sub;
	
	try {
		const experiences = await WorkExperience.findAll({ where: { userId } });
		return res.status(200).json({ experiences });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Step 4: Work Personality
export async function updateWorkPersonality(req, res) {
	const { workingSuperpower, favoriteWorkVibe, tacklingDifficultSituations } = req.body;
	const userId = req.user.sub;
	
	try {
		const [personality, created] = await WorkPersonality.findOrCreate({
			where: { userId },
			defaults: { userId, workingSuperpower, favoriteWorkVibe, tacklingDifficultSituations }
		});
		
		if (!created) {
			await personality.update({ workingSuperpower, favoriteWorkVibe, tacklingDifficultSituations });
		}
		
		return res.status(200).json({ personality });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Step 5: Skills and Specializations
export async function addSkills(req, res) {
	const { skillIds } = req.body;
	const userId = req.user.sub;
	
	try {
		// Remove existing skills
		await UserSkill.destroy({ where: { userId } });
		
		// Add new skills
		const userSkills = await Promise.all(
			skillIds.map(skillId => UserSkill.create({ userId, skillId }))
		);
		
		return res.status(200).json({ userSkills });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function addSpecializations(req, res) {
	const { specializationIds } = req.body;
	const userId = req.user.sub;
	
	try {
		// Remove existing specializations
		await UserSpecialization.destroy({ where: { userId } });
		
		// Add new specializations
		const userSpecializations = await Promise.all(
			specializationIds.map(specializationId => UserSpecialization.create({ userId, specializationId }))
		);
		
		return res.status(200).json({ userSpecializations });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Step 6: Media
export async function uploadMedia(req, res) {
	const { kind, url } = req.body;
	const userId = req.user.sub;
	
	try {
		const media = await Media.create({ userId, kind, url });
		return res.status(201).json({ media });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getMedia(req, res) {
	const userId = req.user.sub;
	
	try {
		const media = await Media.findAll({ where: { userId } });
		return res.status(200).json({ media });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Step 7: Identity Documents
export async function uploadIdentityDocument(req, res) {
	const { type, url } = req.body;
	const userId = req.user.sub;
	
	try {
		const document = await IdentityDocument.create({ userId, type, url });
		return res.status(201).json({ document });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getIdentityDocuments(req, res) {
	const userId = req.user.sub;
	
	try {
		const documents = await IdentityDocument.findAll({ where: { userId } });
		return res.status(200).json({ documents });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Step 8: Job Preferences
export async function updateJobPreferences(req, res) {
	const { idealJobTitle, lookingFor, jobType, workingPattern, payMin, payMax, hourlyRate, preferredLocations, searchRadiusKm, salaryPreference } = req.body;
	const userId = req.user.sub;
	
	try {
		const [preferences, created] = await JobPreference.findOrCreate({
			where: { userId },
			defaults: { userId, idealJobTitle, lookingFor, jobType, workingPattern, payMin, payMax, hourlyRate, preferredLocations, searchRadiusKm, salaryPreference }
		});
		
		if (!created) {
			await preferences.update({ idealJobTitle, lookingFor, jobType, workingPattern, payMin, payMax, hourlyRate, preferredLocations, searchRadiusKm, salaryPreference });
		}
		
		return res.status(200).json({ preferences });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Step 8: Availability
export async function addAvailabilitySlot(req, res) {
	const { start, end } = req.body;
	const userId = req.user.sub;
	
	try {
		const slot = await AvailabilitySlot.create({ userId, start, end });
		return res.status(201).json({ slot });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getAvailabilitySlots(req, res) {
	const userId = req.user.sub;
	
	try {
		const slots = await AvailabilitySlot.findAll({ where: { userId } });
		return res.status(200).json({ slots });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Get all skills and specializations for dropdowns
export async function getAllSkills(req, res) {
	try {
		const skills = await Skill.findAll();
		return res.status(200).json({ skills });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getAllSpecializations(req, res) {
	try {
		const specializations = await Specialization.findAll();
		return res.status(200).json({ specializations });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Unified profile fetch for either candidate or practice based on kind or auto-detect
export async function getUnifiedProfile(req, res) {
    const userId = req.user.sub;
    const { kind } = req.query; // optional: 'candidate' | 'practice'

    try {
        let resolvedKind = (kind || '').toLowerCase();

        if (resolvedKind !== 'candidate' && resolvedKind !== 'practice') {
            // auto-detect: prefer practice if exists, else candidate
            const practice = await PracticeProfile.findOne({ where: { userId } });
            if (practice) {
                resolvedKind = 'practice';
            } else {
                resolvedKind = 'candidate';
            }
        }

        if (resolvedKind === 'candidate') {
            // Reuse logic from getCompleteProfile
            const profile = await CandidateProfile.findOne({ where: { userId } });
            const educations = await Education.findAll({ where: { userId } });
            const workExperiences = await WorkExperience.findAll({ where: { userId } });
            const personality = await WorkPersonality.findOne({ where: { userId } });
            const media = await Media.findAll({ where: { userId } });
            const documents = await IdentityDocument.findAll({ where: { userId } });
            const jobPreferences = await JobPreference.findOne({ where: { userId } });
            const availabilitySlots = await AvailabilitySlot.findAll({ where: { userId } });

            const userSkills = await UserSkill.findAll({ where: { userId }, include: [{ model: Skill }] });
            const userSpecializations = await UserSpecialization.findAll({ where: { userId }, include: [{ model: Specialization }] });

            // Extract logo from media (prefer kind='logo', else first item)
            let logo = null;
            if (media && media.length > 0) {
                const logoMedia = media.find(m => (m.kind || '').toLowerCase() === 'logo');
                logo = logoMedia ? logoMedia.url : (media[0] ? media[0].url : null);
            }

            // Add logo to profile object
            const profileWithLogo = profile ? {
                ...profile.toJSON(),
                logo
            } : null;

            return res.status(200).json({
                kind: 'candidate',
                profile: profileWithLogo,
                educations,
                workExperiences,
                personality,
                skills: userSkills,
                specializations: userSpecializations,
                media,
                documents,
                jobPreferences,
                availabilitySlots
            });
        }

        // practice
        const practiceProfile = await PracticeProfile.findOne({ where: { userId } });
        const practiceMedia = await PracticeMedia.findAll({ where: { userId } });
        const practiceLocations = await PracticeLocation.findAll({ where: { userId } });

        // Extract logo from media (prefer kind='logo', else first item)
        let logo = null;
        if (practiceMedia && practiceMedia.length > 0) {
            const logoMedia = practiceMedia.find(m => (m.kind || '').toLowerCase() === 'logo');
            logo = logoMedia ? logoMedia.url : (practiceMedia[0] ? practiceMedia[0].url : null);
        }

        // Add logo to profile object
        const profileWithLogo = practiceProfile ? {
            ...practiceProfile.toJSON(),
            logo
        } : null;

        return res.status(200).json({
            kind: 'practice',
            profile: profileWithLogo,
            media: practiceMedia,
            locations: practiceLocations
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// Complete Profile Create (All Steps in One)
export async function createCompleteProfile(req, res) {
    const userId = req.user.sub;
    const {
        // Step 1-2: Basic Profile
        fullName, gender, jobTitle, currentStatus, linkedinUrl, aboutMe,
        // Step 3: Education & Experience
        educations, workExperiences,
        // Step 4: Work Personality
        workingSuperpower, favoriteWorkVibe, tacklingDifficultSituations,
        // Step 5: Skills & Specializations
        skillIds, specializationIds,
        // Step 6: Media
        media,
        // Step 7: Identity Documents
        documents,
        // Step 8: Job Preferences & Availability
        jobPreferences, availabilitySlots
    } = req.body;

    try {
        // Do not allow duplicate profile creation
        const existing = await CandidateProfile.findOne({ where: { userId } });
        if (existing) {
            return res.status(400).json({ message: 'Candidate profile already exists. Use PUT /api/profile/complete to update.' });
        }

        // Step 1-2: Create Profile
        const profile = await CandidateProfile.create({
            userId,
            fullName,
            gender,
            jobTitle,
            currentStatus,
            linkedinUrl,
            aboutMe,
            profileCompletion: true
        });

        // Step 3: Educations
        if (Array.isArray(educations) && educations.length > 0) {
            await Promise.all(
                educations.map(edu => Education.create({
                    userId,
                    highestLevel: edu?.highestLevel ?? null,
                    institution: edu?.institution ?? null,
                    fieldOfStudy: edu?.fieldOfStudy ?? null,
                    startDate: edu?.startDate ?? null,
                    endDate: edu?.endDate ?? null,
                }))
            );
        }

        // Step 3: Work Experiences
        if (Array.isArray(workExperiences) && workExperiences.length > 0) {
            const filteredExperiences = workExperiences.filter(exp => !!exp?.company);
            await Promise.all(filteredExperiences.map(exp => WorkExperience.create({ ...exp, userId })));
        }

        // Step 4: Work Personality
        if (workingSuperpower || favoriteWorkVibe || tacklingDifficultSituations) {
            await WorkPersonality.create({ userId, workingSuperpower, favoriteWorkVibe, tacklingDifficultSituations });
        }

        // Step 5: Skills
        if (Array.isArray(skillIds) && skillIds.length > 0) {
            for (const skillName of skillIds) {
                const [skill] = await Skill.findOrCreate({ where: { name: skillName }, defaults: { name: skillName } });
                await UserSkill.create({ userId, skillId: skill.id });
            }
        }

        // Step 5: Specializations
        if (Array.isArray(specializationIds) && specializationIds.length > 0) {
            for (const specName of specializationIds) {
                const [specialization] = await Specialization.findOrCreate({ where: { name: specName }, defaults: { name: specName } });
                await UserSpecialization.create({ userId, specializationId: specialization.id });
            }
        }

        // Step 6: Media
        if (Array.isArray(media) && media.length > 0) {
            await Promise.all(media.map(m => Media.create({ ...m, userId })));
        }

        // Step 7: Identity Documents
        if (Array.isArray(documents) && documents.length > 0) {
            await Promise.all(documents.map(doc => IdentityDocument.create({ ...doc, userId })));
        }

        // Step 8: Job Preferences
        if (jobPreferences) {
            await JobPreference.create({ ...jobPreferences, userId });
        }

        // Step 8: Availability Slots
        if (Array.isArray(availabilitySlots) && availabilitySlots.length > 0) {
            await Promise.all(availabilitySlots.map(slot => AvailabilitySlot.create({ ...slot, userId })));
        }

        return res.status(201).json({ message: 'Candidate profile created successfully', profileId: profile.id, profileCompletion: true });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// Complete Profile Update (All Steps in One)
export async function updateCompleteProfile(req, res) {
	const userId = req.user.sub;
	const {
		// Step 1-2: Basic Profile
		fullName, gender, jobTitle, currentStatus, linkedinUrl, aboutMe,
		// Step 3: Education & Experience
		educations, workExperiences,
		// Step 4: Work Personality
		workingSuperpower, favoriteWorkVibe, tacklingDifficultSituations,
		// Step 5: Skills & Specializations
		skillIds, specializationIds,
		// Step 6: Media
		media,
		// Step 7: Identity Documents
		documents,
		// Step 8: Job Preferences & Availability
		jobPreferences, availabilitySlots
	} = req.body;

	try {
		// Get or create profile (needed for profileCompletion update at the end)
		const [profile] = await CandidateProfile.findOrCreate({
			where: { userId },
			defaults: { userId, fullName, gender, jobTitle, currentStatus, linkedinUrl, aboutMe }
		});

		// Step 1-2: Update/Create Profile
		if (fullName || gender || jobTitle || currentStatus || linkedinUrl || aboutMe) {
			await profile.update({ fullName, gender, jobTitle, currentStatus, linkedinUrl, aboutMe });
		}

		// Step 3: Handle Educations
		if (educations && educations.length > 0) {
			await Education.destroy({ where: { userId } });
			await Promise.all(
				educations.map(edu => Education.create({
					userId,
					highestLevel: edu?.highestLevel ?? null,
					institution: edu?.institution ?? null,
					fieldOfStudy: edu?.fieldOfStudy ?? null,
					startDate: edu?.startDate ?? null,
					endDate: edu?.endDate ?? null,
				}))
			);
		}

		// Step 3: Handle Work Experiences
		if (workExperiences && workExperiences.length > 0) {
			await WorkExperience.destroy({ where: { userId } });
			const filteredExperiences = workExperiences.filter(exp => !!exp?.company);
			await Promise.all(filteredExperiences.map(exp => WorkExperience.create({ ...exp, userId })));
		}

		// Step 4: Work Personality
		if (workingSuperpower || favoriteWorkVibe || tacklingDifficultSituations) {
			const [personality] = await WorkPersonality.findOrCreate({
				where: { userId },
				defaults: { userId, workingSuperpower, favoriteWorkVibe, tacklingDifficultSituations }
			});
			await personality.update({ workingSuperpower, favoriteWorkVibe, tacklingDifficultSituations });
		}

		// Step 5: Skills
		if (skillIds && skillIds.length > 0) {
			await UserSkill.destroy({ where: { userId } });
			// Create skills if they don't exist, then link them
			for (const skillName of skillIds) {
				const [skill] = await Skill.findOrCreate({
					where: { name: skillName },
					defaults: { name: skillName }
				});
				await UserSkill.create({ userId, skillId: skill.id });
			}
		}

		// Step 5: Specializations
		if (specializationIds && specializationIds.length > 0) {
			await UserSpecialization.destroy({ where: { userId } });
			// Create specializations if they don't exist, then link them
			for (const specName of specializationIds) {
				const [specialization] = await Specialization.findOrCreate({
					where: { name: specName },
					defaults: { name: specName }
				});
				await UserSpecialization.create({ userId, specializationId: specialization.id });
			}
		}

		// Step 6: Media
		if (media && media.length > 0) {
			await Media.destroy({ where: { userId } });
			await Promise.all(media.map(m => Media.create({ ...m, userId })));
		}

		// Step 7: Identity Documents
		if (documents && documents.length > 0) {
			await IdentityDocument.destroy({ where: { userId } });
			await Promise.all(documents.map(doc => IdentityDocument.create({ ...doc, userId })));
		}

		// Step 8: Job Preferences
		if (jobPreferences) {
			const [preferences] = await JobPreference.findOrCreate({
				where: { userId },
				defaults: { ...jobPreferences, userId }
			});
			await preferences.update(jobPreferences);
		}

		// Step 8: Availability Slots
		if (availabilitySlots && availabilitySlots.length > 0) {
			await AvailabilitySlot.destroy({ where: { userId } });
			await Promise.all(availabilitySlots.map(slot => AvailabilitySlot.create({ ...slot, userId })));
		}

		// Update profileCompletion to true after successful profile update
		await profile.update({ profileCompletion: true });

		return res.status(200).json({ message: 'Profile updated successfully', profileCompletion: true });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Get Complete Profile (All Data)
export async function getCompleteProfile(req, res) {
	const userId = req.user.sub;
	
	try {
		const profile = await CandidateProfile.findOne({ where: { userId } });
		const educations = await Education.findAll({ where: { userId } });
		const workExperiences = await WorkExperience.findAll({ where: { userId } });
		const personality = await WorkPersonality.findOne({ where: { userId } });
		const media = await Media.findAll({ where: { userId } });
		const documents = await IdentityDocument.findAll({ where: { userId } });
		const jobPreferences = await JobPreference.findOne({ where: { userId } });
		const availabilitySlots = await AvailabilitySlot.findAll({ where: { userId } });

		// Get user skills and specializations with names
		const userSkills = await UserSkill.findAll({ 
			where: { userId },
			include: [{ model: Skill }]
		});
		const userSpecializations = await UserSpecialization.findAll({ 
			where: { userId },
			include: [{ model: Specialization }]
		});

		// Extract logo from media (prefer kind='logo', else first item)
		let logo = null;
		if (media && media.length > 0) {
			const logoMedia = media.find(m => (m.kind || '').toLowerCase() === 'logo');
			logo = logoMedia ? logoMedia.url : (media[0] ? media[0].url : null);
		}

		// Add logo to profile object
		const profileWithLogo = profile ? {
			...profile.toJSON(),
			logo
		} : null;

		return res.status(200).json({
			profile: profileWithLogo,
			educations,
			workExperiences,
			personality,
			skills: userSkills,
			specializations: userSpecializations,
			media,
			documents,
			jobPreferences,
			availabilitySlots
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Get Candidate by ID (Public - for practices to view candidates)
export async function getCandidateById(req, res) {
	const { id } = req.params; // Can be userId or candidate profile id
	
	try {
		// Try to find by candidate profile id first
		let profile = await CandidateProfile.findByPk(id);
		let userId = null;
		
		if (profile) {
			userId = profile.userId;
		} else {
			// If not found, assume it's a userId
			userId = id;
			profile = await CandidateProfile.findOne({ where: { userId } });
		}
		
		if (!profile) {
			return res.status(404).json({ message: 'Candidate not found' });
		}
		
		// Get all candidate data
		const educations = await Education.findAll({ where: { userId } });
		const workExperiences = await WorkExperience.findAll({ where: { userId } });
		const personality = await WorkPersonality.findOne({ where: { userId } });
		const media = await Media.findAll({ where: { userId } });
		const documents = await IdentityDocument.findAll({ where: { userId } });
		const jobPreferences = await JobPreference.findOne({ where: { userId } });
		const availabilitySlots = await AvailabilitySlot.findAll({ where: { userId } });

		// Get user skills and specializations with names
		const userSkills = await UserSkill.findAll({ 
			where: { userId },
			include: [{ model: Skill }]
		});
		const userSpecializations = await UserSpecialization.findAll({ 
			where: { userId },
			include: [{ model: Specialization }]
		});

		// Extract logo from media (prefer kind='logo', else first item)
		let logo = null;
		if (media && media.length > 0) {
			const logoMedia = media.find(m => (m.kind || '').toLowerCase() === 'logo');
			logo = logoMedia ? logoMedia.url : (media[0] ? media[0].url : null);
		}

		// Add logo to profile object
		const profileWithLogo = profile ? {
			...profile.toJSON(),
			logo
		} : null;

		return res.status(200).json({
			profile: profileWithLogo,
			educations,
			workExperiences,
			personality,
			skills: userSkills,
			specializations: userSpecializations,
			media,
			documents,
			jobPreferences,
			availabilitySlots
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}
