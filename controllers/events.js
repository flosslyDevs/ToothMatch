import { Event, Booking, User, Media } from '../models/index.js';
import { Op } from 'sequelize';

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

export async function bookEvent(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user.sub;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.userId === userId) {
      return res
        .status(400)
        .json({ message: 'You cannot book your own event' });
    }
    const time = new Date();

    if (event.end_time < time) {
      return res.status(400).json({ message: 'Event has already ended' });
    }

    const prevBooking = await Booking.findOne({ where: { eventId, userId } });

    if (prevBooking) {
      return res
        .status(400)
        .json({ message: 'You have already booked this event' });
    }

    const booking = await Booking.create({
      eventId,
      userId,
    });

    return res.status(201).json({ booking });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getBookings(req, res) {
  try {
    const userId = req.user.sub;
    const bookings = await Booking.findAll({
      where: { userId },
      include: [{
        model: Event,
        include: [{
          model: User,
          attributes: ['id', 'fullName'],
          include: [{
            model: Media,
            attributes: ['kind', 'url'],
            limit: 1,
            separate: true,
            required: false,
            where: {
              kind: {
                [Op.in]: ['logo', 'profile_photo'],
              },
            },
            order: [['createdAt', 'DESC']],
          }],
        }]
      }],
    });
    const bookingsWithAvatar = bookings.map((booking) => {
      const bookingData = booking.toJSON();
      const avatar = bookingData.Event?.User?.Media?.[0]?.url || null;
      bookingData.event = bookingData.Event;
      delete bookingData.Event;
      bookingData.event.user = bookingData.event?.User || null;
      delete bookingData.event?.User;
      delete bookingData.event?.user?.Media;
      bookingData.event.user.avatar = avatar;
      return bookingData;
    });
    return res.status(200).json({ bookings: bookingsWithAvatar });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
