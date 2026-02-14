jest.mock('../../models/Shelter');

const Shelter = require('../../models/Shelter');
const shelterController = require('../../controller/shelterController');
const {mockRequest, mockResponse} = require('./testUtils/mockExpress');

beforeEach(
    () => {
        jest.clearAllMocks();
    }
);

// Test case for creating a shelter
describe('getAllShelters', () => {
    it('should return all shelters with 200', async () => {
        const sheltersArray = [
            {
                _id: '1',
                name: 'Shelter 1',
                description: 'Description 1',
                address: 'Address 1',
                contactInfo: 'Contact Info 1',
                capacity: 100,
                currentOccupancy: 50,
                reliefItems: ["water"],
                createdAt: new Date(),
                updatedAt: new Date(),
            }];
            
                Shelter.find.mockReturnValue(
                    {
                        lean: jest.fn().mockResolvedValue(sheltersArray),
                    }
                );
        
                const req = mockRequest();
                const res = mockResponse();
        
                await shelterController.getAllShelters(req, res);
        
                expect(res.status).not.toHaveBeenCalledWith(200);
                expect(res.json).toHaveBeenCalledWith(sheltersArray);
            });

    it('should return 500 if there is an error', async () => {
        Shelter.find.mockReturnValue(
            {
                lean: jest.fn().mockRejectedValue(new Error('Database error')),
            }
        );

        const req = mockRequest();
        const res = mockResponse();
        
        await shelterController.getAllShelters(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Failed to fetch shelters',
                })
            );
    
        });
    });
// === getShelterById ===
describe('getShelterById', () => {
  it('should return shelter when found', async () => {
    const fakeShelter = { _id: '123', name: 'Test' };

    Shelter.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(fakeShelter),
    });

    const req = {params: { id: '123' }};
    const res = mockResponse();

    await shelterController.getShelterById(req, res);

    expect(Shelter.findById).toHaveBeenCalledWith('123');
    expect(res.json).toHaveBeenCalledWith(fakeShelter);
  });

  it('should return 404 when shelter not found', async () => {
    Shelter.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const req = mockRequest({ params: { id: 'not-exist' } });
    const res = mockResponse();

    await shelterController.getShelterById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Shelter not found' })
    );
  });

  it('should return 400 on invalid ID/error', async () => {
    Shelter.findById.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error('CastError')),
    });

    const req = mockRequest({ params: { id: 'bad-id' } });
    const res = mockResponse();

    await shelterController.getShelterById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid shelter ID' })
    );
  });
});
// === createShelter ===
describe('createShelter', () => {
  it('should create shelter and return 201', async () => {
    const body = { name: 'Shelter A', address: 'X', district: 'Y' };
    const created = { _id: '111', ...body };

    Shelter.create.mockResolvedValue(created);

    const req = { body };
    const res = mockResponse();

    await shelterController.createShelter(req, res);

    expect(Shelter.create).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('should handle create error with 400', async () => {
    Shelter.create.mockRejectedValue(new Error('Validation failed'));

    const req = mockRequest({ body: { name: 'Bad' } });
    const res = mockResponse();

    await shelterController.createShelter(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Failed to create shelter' })
    );
  });
});

// === updateShelter ===
describe('updateShelterItem', () => {
  it('should return 400 if name missing', async () => {
    const req = mockRequest({ body: {}, params: { id: '1' } });
    const res = mockResponse();

    await shelterController.updateShelterItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Item name is required' })
    );
  });

  it('should update existing item', async () => {
    const existingShelter = {
      _id: 's1',
      reliefItems: [
        { name: 'Rice', quantity: 10, category: 'food', unit: 'kg' },
      ],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findById.mockResolvedValue(existingShelter);

    const req = {
      params: { id: 's1' },
      body: { name: 'Rice', quantity: 20 },
    };
    const res = mockResponse();

    await shelterController.updateShelterItem(req, res);

    expect(Shelter.findById).toHaveBeenCalledWith('s1');
    expect(existingShelter.reliefItems[0].quantity).toBe(20);
    expect(existingShelter.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(existingShelter);
  });

  it('should add new item when not exists', async () => {
    const existingShelter = {
      _id: 's1',
      reliefItems: [],
      save: jest.fn().mockResolvedValue(true),
    };

    Shelter.findById=jest.fn().mockResolvedValue(existingShelter);

    const req = {
      params: { id: 's1' },
      body: { name: 'Water', quantity: 5, unit: 'liters' },
    };
    const res = mockResponse();

    await shelterController.updateShelterItem(req, res);

    expect(existingShelter.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        reliefItems: expect.arrayContaining([
          expect.objectContaining({
            name: 'Water',
            quantity: 5,
            unit: 'liters',
          }),
        ]),
      })
    );

    expect(existingShelter.reliefItems.length).toBe(1);
    expect(existingShelter.reliefItems[0].name).toBe('Water');
    expect(existingShelter.reliefItems[0].quantity).toBe(5);
    expect(existingShelter.reliefItems[0].unit).toBe('liters');

    expect(existingShelter.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(existingShelter);
  });
});
