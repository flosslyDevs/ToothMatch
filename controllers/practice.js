import { 
	User,
	PracticeProfile,
	PracticeMedia,
	PracticeLocation,
	PracticeCompliance,
	PracticePayment,
	PracticeCulture,
} from '../models/index.js';

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
		payment, // { stripeAccountId, bankAccountDetails, invoiceEmail, billingAddress, defaultLocationRatesPerRole, cancellationPolicy }
		// Step 6
		culture, // { clinicCultureDescriptors, benefitsOffered, workloadStyle }
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
		if (compliance) {
			const [comp] = await PracticeCompliance.findOrCreate({ where: { userId }, defaults: { ...compliance, userId } });
			await comp.update(compliance);
		}

		// Step 5: Payment (single row upsert)
		if (payment) {
			const [pay] = await PracticePayment.findOrCreate({ where: { userId }, defaults: { ...payment, userId } });
			await pay.update(payment);
		}

		// Step 6: Culture (single row upsert)
		if (culture) {
			const [cul] = await PracticeCulture.findOrCreate({ where: { userId }, defaults: { ...culture, userId } });
			await cul.update(culture);
		}

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
		const compliance = await PracticeCompliance.findOne({ where: { userId } });
		const payment = await PracticePayment.findOne({ where: { userId } });
		const culture = await PracticeCulture.findOne({ where: { userId } });
		return res.status(200).json({ profile, media, locations, compliance, payment, culture });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}



