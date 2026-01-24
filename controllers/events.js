import { Event, Booking, User, Media } from '../models/index.js';
import { Op } from 'sequelize';
import { logger as loggerRoot } from '../utils/logger.js';

const loggerBase = loggerRoot.child('controllers/events.js');

// Get all events (no pagination, returns all records)
export async function getEvents(req, res) {
  const logger = loggerBase.child('getEvents');
  try {
    logger.debug('Fetching all events');
    const events = await Event.findAll({
      order: [['start_time', 'ASC']],
    });

    logger.debug('Events fetched', { count: events.length });
    return res.status(200).json({ events });
  } catch (error) {
    logger.error('Error fetching events', { error: error.message }, error);
    return res.status(500).json({ message: error.message });
  }
}

export async function bookEvent(req, res) {
  const logger = loggerBase.child('bookEvent');
  try {
    const { eventId } = req.params;
    const userId = req.user.sub;
    logger.debug('Booking event', { userId, eventId });

    const event = await Event.findByPk(eventId);
    if (!event) {
      logger.warn('Event not found', { eventId });
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.userId === userId) {
      logger.warn('User attempted to book own event', { userId, eventId });
      return res
        .status(400)
        .json({ message: 'You cannot book your own event' });
    }
    const time = new Date();

    if (event.end_time < time) {
      logger.warn('Event has already ended', {
        eventId,
        endTime: event.end_time,
      });
      return res.status(400).json({ message: 'Event has already ended' });
    }

    const prevBooking = await Booking.findOne({ where: { eventId, userId } });

    if (prevBooking) {
      logger.warn('User already booked this event', { userId, eventId });
      return res
        .status(400)
        .json({ message: 'You have already booked this event' });
    }

    const booking = await Booking.create({
      eventId,
      userId,
    });

    logger.info('Event booked successfully', {
      userId,
      eventId,
      bookingId: booking.id,
    });
    return res.status(201).json({ booking });
  } catch (error) {
    logger.error(
      'Error booking event',
      {
        userId: req.user?.sub,
        eventId: req.params?.eventId,
        error: error.message,
      },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}

export async function getBookings(req, res) {
  const logger = loggerBase.child('getBookings');
  try {
    const userId = req.user.sub;
    logger.debug('Fetching bookings', { userId });
    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        {
          model: Event,
          include: [
            {
              model: User,
              attributes: ['id', 'fullName'],
              include: [
                {
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
                },
              ],
            },
          ],
        },
      ],
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
    logger.debug('Bookings fetched', {
      userId,
      count: bookingsWithAvatar.length,
    });
    return res.status(200).json({ bookings: bookingsWithAvatar });
  } catch (error) {
    logger.error(
      'Error fetching bookings',
      { userId: req.user?.sub, error: error.message },
      error
    );
    return res.status(500).json({ message: error.message });
  }
}
