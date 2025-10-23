import { 
	User,
	PracticeProfile,
	PracticeMedia,
	PracticeLocation,
	PracticeCompliance,
	PracticePayment,
	PracticeCulture,
} from '../models/index.js';

// Create a new practice profile
export async function createPracticeProfile(req, res) {
	const userId = req.user.sub;
	const {
		// Step 1
		clinicType,
		media, // [{ kind: 'clinic_photo'|'team_photo'|'logo', url }]
		// Step 2
		website, instagram, facebook, linkedin, phoneNumber, hideFromPublic,
		// Step 3
		locations, // [{ address, phone, parking, publicTransport, branchManagerUserId }]
		// Step 4
		compliance, // { documentsRequired, yearsOfExperience, skillsOrSoftwareRequired }
		// Step 5
		// payment, // { stripeAccountId, bankAccountDetails, invoiceEmail, billingAddress, defaultLocationRatesPerRole, cancellationPolicy }
		// Step 6
		// culture, // { clinicCultureDescriptors, benefitsOffered, workloadStyle }
	} = req.body || {};

	try {
		// Check if user already has a practice profile
		const existingProfile = await PracticeProfile.findOne({ where: { userId } });
		if (existingProfile) {
			return res.status(400).json({ message: 'Practice profile already exists for this user. Use PUT to update.' });
		}

		// Step 1 + 2: Create basic practice profile & brand/contact
		const profile = await PracticeProfile.create({ 
			userId, 
			clinicType, 
			website, 
			instagram, 
			facebook, 
			linkedin, 
			phoneNumber, 
			hideFromPublic 
		});

		// Step 1: Media (create all)
		if (Array.isArray(media)) {
			await Promise.all(media.map(m => PracticeMedia.create({ ...m, userId })));
		}

		// Step 3: Locations (create all)
		if (Array.isArray(locations)) {
			await Promise.all(locations.map(loc => PracticeLocation.create({ ...loc, userId })));
		}

		// Step 4: Compliance (create single row)
		// if (compliance) {
		// 	await PracticeCompliance.create({ ...compliance, userId });
		// }

		// Step 5: Payment (create single row)
		// if (payment) {
		// 	await PracticePayment.create({ ...payment, userId });
		// }

		// Step 6: Culture (create single row)
		// if (culture) {
		// 	await PracticeCulture.create({ ...culture, userId });
		// }

		return res.status(201).json({ message: 'Practice profile created successfully', profileId: profile.id });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Upsert all practice data in a single payload
export async function upsertPracticeProfile(req, res) {
	const userId = req.user.sub;
	const {
		// Step 1
		clinicType,
		media, // [{ kind: 'clinic_photo'|'team_photo'|'logo', url }]
		// Step 2
		website, instagram, facebook, linkedin, phoneNumber, hideFromPublic,
		// Step 3
		locations, // [{ address, phone, parking, publicTransport, branchManagerUserId }]
		// Step 4
		compliance, // { documentsRequired, yearsOfExperience, skillsOrSoftwareRequired }
		// Step 5
		// payment, // { stripeAccountId, bankAccountDetails, invoiceEmail, billingAddress, defaultLocationRatesPerRole, cancellationPolicy }
		// Step 6
		// culture, // { clinicCultureDescriptors, benefitsOffered, workloadStyle }
	} = req.body || {};

	try {
		// Step 1 + 2: Basic practice profile & brand/contact
		const [profile] = await PracticeProfile.findOrCreate({
			where: { userId },
			defaults: { userId, clinicType, website, instagram, facebook, linkedin, phoneNumber, hideFromPublic }
		});
		await profile.update({ clinicType, website, instagram, facebook, linkedin, phoneNumber, hideFromPublic });

		// Step 1: Media (replace all)
		if (Array.isArray(media)) {
			await PracticeMedia.destroy({ where: { userId } });
			await Promise.all(media.map(m => PracticeMedia.create({ ...m, userId })));
		}

		// Step 3: Locations (replace all)
		if (Array.isArray(locations)) {
			await PracticeLocation.destroy({ where: { userId } });
			await Promise.all(locations.map(loc => PracticeLocation.create({ ...loc, userId })));
		}

		// Step 4: Compliance (single row upsert)
		// if (compliance) {
		// 	const [comp] = await PracticeCompliance.findOrCreate({ where: { userId }, defaults: { ...compliance, userId } });
		// 	await comp.update(compliance);
		// }

		// Step 5: Payment (single row upsert)
		// if (payment) {
		// 	const [pay] = await PracticePayment.findOrCreate({ where: { userId }, defaults: { ...payment, userId } });
		// 	await pay.update(payment);
		// }

		// Step 6: Culture (single row upsert)
		// if (culture) {
		// 	const [cul] = await PracticeCulture.findOrCreate({ where: { userId }, defaults: { ...culture, userId } });
		// 	await cul.update(culture);
		// }

		return res.status(200).json({ message: 'Practice profile saved' });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getPracticeProfile(req, res) {
	const userId = req.user.sub;
	try {
		const profile = await PracticeProfile.findOne({ where: { userId } });
		const media = await PracticeMedia.findAll({ where: { userId } });
		const locations = await PracticeLocation.findAll({ where: { userId } });
		// const compliance = await PracticeCompliance.findOne({ where: { userId } });
		// const payment = await PracticePayment.findOne({ where: { userId } });
		// const culture = await PracticeCulture.findOne({ where: { userId } });
		return res.status(200).json({ profile, media, locations });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Get all practice profiles for a specific user
export async function getAllUserProfiles(req, res) {
	const { userId } = req.params;
	try {
		const profiles = await PracticeProfile.findAll({ 
			where: { userId },
			include: [
				{
					model: PracticeMedia
				},
				{
					model: PracticeLocation
				},
				// {
				// 	model: PracticeCompliance
				// }
			]
		});
		return res.status(200).json({ profiles });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

// Get a specific practice profile by ID
export async function getSpecificPractice(req, res) {
	const { practiceId } = req.params;
	try {
		const profile = await PracticeProfile.findByPk(practiceId, {
			include: [
				{
					model: PracticeMedia
				},
				{
					model: PracticeLocation
				},
				// {
				// 	model: PracticeCompliance
				// }
			]
		});
		
		if (!profile) {
			return res.status(404).json({ message: 'Practice profile not found' });
		}
		
		return res.status(200).json({ profile });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}



