import { jest } from "@jest/globals";

// Mock models using unstable_mockModule
jest.unstable_mockModule("../../models/Event.js", () => ({
  findById: jest.fn(),
  findRelated: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deleteEvent: jest.fn(),
  incrementViews: jest.fn(),
  findAll: jest.fn(),
  checkEventPermission: jest.fn(),
}));

jest.unstable_mockModule("../../models/TicketType.js", () => ({
  findByEventId: jest.fn(),
}));

jest.unstable_mockModule("../../models/Review.js", () => ({
  findByEventId: jest.fn(),
}));

describe("EventService", () => {
  let EventService;
  let EventModel;
  let TicketTypeModel;
  let ReviewModel;
  let eventService;

  beforeAll(async () => {
    EventModel = await import("../../models/Event.js");
    TicketTypeModel = await import("../../models/TicketType.js");
    ReviewModel = await import("../../models/Review.js");
    const { EventService: EventServiceClass } = await import(
      "../../services/EventService.js"
    );
    EventService = EventServiceClass;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    eventService = new EventService();
  });

  describe("getEventById", () => {
    it("should return event with ticket types and reviews", async () => {
      const eventId = 1;
      const mockEvent = {
        id: eventId,
        name: "Test Event",
        category_id: 1,
      };
      const mockTicketTypes = [
        { id: 1, name: "General", price: 50 },
        { id: 2, name: "VIP", price: 100 },
      ];
      const mockReviews = [
        { id: 1, rating: 5, comment: "Great!" },
        { id: 2, rating: 4, comment: "Good" },
      ];
      const mockRelatedEvents = [
        { id: 2, name: "Related Event 1" },
        { id: 3, name: "Related Event 2" },
      ];

      EventModel.findById.mockResolvedValue(mockEvent);
      TicketTypeModel.findByEventId.mockResolvedValue(mockTicketTypes);
      ReviewModel.findByEventId.mockResolvedValue(mockReviews);
      EventModel.findRelated.mockResolvedValue(mockRelatedEvents);

      const result = await eventService.getEventById(eventId);

      expect(EventModel.findById).toHaveBeenCalledWith(eventId);
      expect(TicketTypeModel.findByEventId).toHaveBeenCalledWith(eventId);
      expect(ReviewModel.findByEventId).toHaveBeenCalledWith(eventId);
      expect(EventModel.findRelated).toHaveBeenCalledWith(
        mockEvent.category_id,
        eventId,
        4
      );

      expect(result.event).toEqual(mockEvent);
      expect(result.ticketTypes).toEqual(mockTicketTypes);
      expect(result.reviews.averageRating).toBe("4.5");
      expect(result.relatedEvents).toEqual(mockRelatedEvents);
    });

    it("should throw error if event not found", async () => {
      EventModel.findById.mockResolvedValue(null);

      await expect(eventService.getEventById(999)).rejects.toThrow(
        "Event not found"
      );
    });

    it("should handle events with no reviews", async () => {
      const mockEvent = { id: 1, name: "Test Event", category_id: 1 };

      EventModel.findById.mockResolvedValue(mockEvent);
      TicketTypeModel.findByEventId.mockResolvedValue([]);
      ReviewModel.findByEventId.mockResolvedValue([]);
      EventModel.findRelated.mockResolvedValue([]);

      const result = await eventService.getEventById(1);

      expect(result.reviews.averageRating).toBe(0);
      expect(result.reviews.count).toBe(0);
    });
  });

  describe("incrementViewCount", () => {
    it("should increment view count for event", async () => {
      const eventId = 1;
      EventModel.incrementViews.mockResolvedValue();

      await eventService.incrementViewCount(eventId);

      expect(EventModel.incrementViews).toHaveBeenCalledWith(eventId);
    });
  });

  describe("getEventTicketTypes", () => {
    it("should return ticket types for event", async () => {
      const eventId = 1;
      const mockEvent = { id: eventId, name: "Test Event" };
      const mockTicketTypes = [
        { id: 1, name: "General", price: 50 },
        { id: 2, name: "VIP", price: 100 },
      ];

      EventModel.findById.mockResolvedValue(mockEvent);
      TicketTypeModel.findByEventId.mockResolvedValue(mockTicketTypes);

      const result = await eventService.getEventTicketTypes(eventId);

      expect(EventModel.findById).toHaveBeenCalledWith(eventId);
      expect(TicketTypeModel.findByEventId).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(mockTicketTypes);
    });

    it("should throw error if event not found", async () => {
      EventModel.findById.mockResolvedValue(null);

      await expect(eventService.getEventTicketTypes(999)).rejects.toThrow(
        "Event not found"
      );
    });
  });

  describe("createEvent", () => {
    it("should create event successfully", async () => {
      const eventData = {
        name: "New Event",
        description: "Description",
        date: "2024-12-25",
      };
      const createdEvent = { id: 1, ...eventData };

      EventModel.create.mockResolvedValue(createdEvent);
      eventService.executeInTransaction = jest.fn(async (callback) =>
        callback()
      );

      const result = await eventService.createEvent(eventData);

      expect(EventModel.create).toHaveBeenCalledWith(eventData, undefined);
      expect(result).toEqual(createdEvent);
    });
  });

  describe("updateEvent", () => {
    it("should update event successfully", async () => {
      const eventId = 1;
      const updateData = { name: "Updated Event" };
      const updatedEvent = { id: eventId, ...updateData };

      EventModel.update.mockResolvedValue(updatedEvent);
      eventService.executeInTransaction = jest.fn(async (callback) =>
        callback()
      );

      const result = await eventService.updateEvent(eventId, updateData);

      expect(EventModel.update).toHaveBeenCalledWith(
        eventId,
        updateData,
        undefined
      );
      expect(result).toEqual(updatedEvent);
    });

    it("should throw error if event not found", async () => {
      EventModel.update.mockResolvedValue(null);
      eventService.executeInTransaction = jest.fn(async (callback) =>
        callback()
      );

      await expect(eventService.updateEvent(999, {})).rejects.toThrow(
        "Event not found"
      );
    });
  });

  describe("deleteEvent", () => {
    it("should delete event successfully", async () => {
      const eventId = 1;
      const deleteResult = { id: eventId };

      EventModel.deleteEvent.mockResolvedValue(deleteResult);
      eventService.executeInTransaction = jest.fn(async (callback) =>
        callback()
      );

      const result = await eventService.deleteEvent(eventId);

      expect(EventModel.deleteEvent).toHaveBeenCalledWith(eventId, undefined);
      expect(result).toEqual(deleteResult);
    });

    it("should throw error if event not found", async () => {
      EventModel.deleteEvent.mockResolvedValue(null);
      eventService.executeInTransaction = jest.fn(async (callback) =>
        callback()
      );

      await expect(eventService.deleteEvent(999)).rejects.toThrow(
        "Event not found"
      );
    });
  });

  describe("findAllEvents", () => {
    it("should return all events with filters and pagination", async () => {
      const filters = { category: "music" };
      const pagination = { page: 1, limit: 10 };
      const mockEvents = [
        { id: 1, name: "Event 1" },
        { id: 2, name: "Event 2" },
      ];

      EventModel.findAll.mockResolvedValue(mockEvents);

      const result = await eventService.findAllEvents(filters, pagination);

      expect(EventModel.findAll).toHaveBeenCalledWith(filters, pagination);
      expect(result).toEqual(mockEvents);
    });
  });

  describe("findRelatedEvents", () => {
    it("should return related events", async () => {
      const categoryId = 1;
      const currentEventId = 2;
      const limit = 4;
      const mockRelatedEvents = [
        { id: 3, name: "Related Event 1" },
        { id: 4, name: "Related Event 2" },
      ];

      EventModel.findRelated.mockResolvedValue(mockRelatedEvents);

      const result = await eventService.findRelatedEvents(
        categoryId,
        currentEventId,
        limit
      );

      expect(EventModel.findRelated).toHaveBeenCalledWith(
        categoryId,
        currentEventId,
        limit
      );
      expect(result).toEqual(mockRelatedEvents);
    });
  });

  describe("checkEventPermission", () => {
    it("should check event permission for user", async () => {
      const eventId = 1;
      const userId = 1;
      const mockPermission = true;

      EventModel.checkEventPermission.mockResolvedValue(mockPermission);

      const result = await eventService.checkEventPermission(eventId, userId);

      expect(EventModel.checkEventPermission).toHaveBeenCalledWith(
        eventId,
        userId
      );
      expect(result).toBe(mockPermission);
    });
  });
});
