import { Event } from '../models/index.js';

// Get all events (no pagination, returns all records)
export async function getEvents(req, res) {
	try {
		const events = await Event.findAll({
			order: [['start_time', 'ASC']],
		});

		return res.status(200).json({ events });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}
