import mongoose from 'mongoose';
import { Channel, ChannelDocument } from '../channel.model';
import { UserModel } from '../user.model';

// Use in-memory MongoDB instance setup in setup.ts

describe('Channel Model', () => {
  // Reference to test user ID
  let testUserId: mongoose.Types.ObjectId;

  // Test data
  const channelData = {
    youtubeId: 'UC12345abcde',
    name: 'Test Channel',
    description: 'A test channel for unit tests',
    customUrl: '@testchannel',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    subscriberCount: 5000,
    videoCount: 100,
    country: 'US',
    publishedAt: new Date('2020-01-01'),
    isArchived: false,
    archiveStatus: 'none' as const,
  };

  // Setup test user before running tests
  beforeAll(async () => {
    // Create a test user to reference in channel tests
    const user = new UserModel({
      username: 'channeltester',
      email: 'channel@example.com',
      password: 'password123',
    });
    const savedUser = await user.save();
    testUserId = savedUser._id as mongoose.Types.ObjectId;
  });

  // Clean up after tests
  afterAll(async () => {
    await Channel.deleteMany({});
    await UserModel.deleteMany({});
  });

  it('should create a new channel successfully', async () => {
    const channel = new Channel({
      ...channelData,
      createdBy: testUserId,
    });
    
    const savedChannel = await channel.save();
    
    // Check saved channel
    expect(savedChannel._id).toBeDefined();
    expect(savedChannel.youtubeId).toBe(channelData.youtubeId);
    expect(savedChannel.name).toBe(channelData.name);
    expect(savedChannel.description).toBe(channelData.description);
    expect(savedChannel.customUrl).toBe(channelData.customUrl);
    expect(savedChannel.thumbnailUrl).toBe(channelData.thumbnailUrl);
    expect(savedChannel.subscriberCount).toBe(channelData.subscriberCount);
    expect(savedChannel.videoCount).toBe(channelData.videoCount);
    expect(savedChannel.country).toBe(channelData.country);
    expect(savedChannel.publishedAt?.toISOString()).toBe(channelData.publishedAt.toISOString());
    expect(savedChannel.isArchived).toBe(channelData.isArchived);
    expect(savedChannel.archiveStatus).toBe(channelData.archiveStatus);
    expect(savedChannel.createdBy.toString()).toBe(testUserId.toString());
    expect(savedChannel.createdAt).toBeDefined();
    expect(savedChannel.updatedAt).toBeDefined();
  });

  it('should require youtubeId, name, and createdBy fields', async () => {
    // Test without youtubeId
    const channelWithoutYoutubeId = new Channel({
      name: channelData.name,
      createdBy: testUserId,
    });

    // Test without name
    const channelWithoutName = new Channel({
      youtubeId: 'UC67890fghij',
      createdBy: testUserId,
    });

    // Test without createdBy
    const channelWithoutCreatedBy = new Channel({
      youtubeId: 'UC67890fghij',
      name: channelData.name,
    });

    // Validate each case
    await expect(channelWithoutYoutubeId.validate()).rejects.toThrow();
    await expect(channelWithoutName.validate()).rejects.toThrow();
    await expect(channelWithoutCreatedBy.validate()).rejects.toThrow();
  });

  it('should not allow duplicate youtubeId', async () => {
    // First create a channel
    await new Channel({
      youtubeId: 'UC98765zyxwv',
      name: 'Original Channel',
      createdBy: testUserId,
    }).save();
    
    // Try to create another channel with the same youtubeId
    const duplicateChannel = new Channel({
      youtubeId: 'UC98765zyxwv',
      name: 'Duplicate Channel',
      createdBy: testUserId,
    });
    
    // This should fail due to unique constraint
    await expect(duplicateChannel.save()).rejects.toThrow();
  });

  it('should set default values correctly', async () => {
    const channelWithDefaults = new Channel({
      youtubeId: 'UC24680rstuvw',
      name: 'Default Values Channel',
      createdBy: testUserId,
    });
    
    const savedChannel = await channelWithDefaults.save();
    
    // Check default values
    expect(savedChannel.isArchived).toBe(false);
    expect(savedChannel.archiveStatus).toBe('none');
  });

  it('should only allow valid enum values for archiveStatus', async () => {
    // Valid values
    const validStatuses = ['none', 'partial', 'complete'];
    
    // Test each valid value
    for (const status of validStatuses) {
      const channel = new Channel({
        youtubeId: `UC_${status}_${Date.now()}`,
        name: `${status} Status Channel`,
        archiveStatus: status as 'none' | 'partial' | 'complete',
        createdBy: testUserId,
      });
      
      const savedChannel = await channel.save();
      expect(savedChannel.archiveStatus).toBe(status);
    }
    
    // Test invalid value
    const channelWithInvalidStatus = new Channel({
      youtubeId: 'UC_invalid_status',
      name: 'Invalid Status Channel',
      archiveStatus: 'invalid' as any, // Intentionally testing an invalid value
      createdBy: testUserId,
    });
    
    await expect(channelWithInvalidStatus.validate()).rejects.toThrow();
  });

  it('should update a channel successfully', async () => {
    // Create a channel
    const channel = new Channel({
      youtubeId: 'UC_update_test',
      name: 'Channel Before Update',
      subscriberCount: 1000,
      createdBy: testUserId,
    });
    
    const savedChannel = await channel.save();
    
    // Update the channel
    savedChannel.name = 'Channel After Update';
    savedChannel.subscriberCount = 2000;
    savedChannel.isArchived = true;
    savedChannel.archiveStatus = 'complete';
    
    const updatedChannel = await savedChannel.save();
    
    // Check updated values
    expect(updatedChannel.name).toBe('Channel After Update');
    expect(updatedChannel.subscriberCount).toBe(2000);
    expect(updatedChannel.isArchived).toBe(true);
    expect(updatedChannel.archiveStatus).toBe('complete');
    // The updatedAt field should change
    expect(updatedChannel.updatedAt).not.toEqual(savedChannel.updatedAt);
  });

  it('should find channels by text search on name and description', async () => {
    // Create test channels with searchable text
    await Promise.all([
      new Channel({
        youtubeId: 'UC_search_test1',
        name: 'Cooking Recipes Channel',
        description: 'Learn to cook delicious meals',
        createdBy: testUserId,
      }).save(),
      
      new Channel({
        youtubeId: 'UC_search_test2',
        name: 'Programming Tutorials',
        description: 'Learn to code with our cooking analogies',
        createdBy: testUserId,
      }).save(),
      
      new Channel({
        youtubeId: 'UC_search_test3',
        name: 'Travel Vlogs',
        description: 'Explore the world',
        createdBy: testUserId,
      }).save(),
    ]);
    
    // Test text search
    const cookingResults = await Channel.find(
      { $text: { $search: 'cooking' } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    
    // Should find both channels with "cooking" in name or description
    expect(cookingResults.length).toBe(2);
    expect(cookingResults.map(c => c.youtubeId)).toContain('UC_search_test1');
    expect(cookingResults.map(c => c.youtubeId)).toContain('UC_search_test2');
    
    // Relevance should put the cooking channel first (it has "cooking" in the name)
    expect(cookingResults[0].youtubeId).toBe('UC_search_test1');
  });

  it('should find channels by archive status', async () => {
    // Create channels with different archive statuses
    await Promise.all([
      new Channel({
        youtubeId: 'UC_archive_none',
        name: 'Not Archived Channel',
        isArchived: false,
        archiveStatus: 'none',
        createdBy: testUserId,
      }).save(),
      
      new Channel({
        youtubeId: 'UC_archive_partial',
        name: 'Partially Archived Channel',
        isArchived: true,
        archiveStatus: 'partial',
        createdBy: testUserId,
      }).save(),
      
      new Channel({
        youtubeId: 'UC_archive_complete',
        name: 'Completely Archived Channel',
        isArchived: true,
        archiveStatus: 'complete',
        createdBy: testUserId,
      }).save(),
    ]);
    
    // Query by isArchived
    const archivedChannels = await Channel.find({ isArchived: true });
    expect(archivedChannels.length).toBe(2);
    
    // Query by archiveStatus
    const completeChannels = await Channel.find({ archiveStatus: 'complete' });
    expect(completeChannels.length).toBe(1);
    expect(completeChannels[0].youtubeId).toBe('UC_archive_complete');
  });

  it('should find channels by createdBy user', async () => {
    // Create another user
    const anotherUser = new UserModel({
      username: 'anothertester',
      email: 'another@example.com',
      password: 'password123',
    });
    const savedAnotherUser = await anotherUser.save();
    
    // Create a channel by another user
    await new Channel({
      youtubeId: 'UC_another_user',
      name: 'Another User Channel',
      createdBy: savedAnotherUser._id,
    }).save();
    
    // Query channels by our test user
    const userChannels = await Channel.find({ createdBy: testUserId });
    
    // Count should be all previously created channels
    // None of them should be the channel created by another user
    expect(userChannels.length).toBeGreaterThan(0);
    expect(userChannels.every(c => c.youtubeId !== 'UC_another_user')).toBe(true);
    
    // Query channels by the other user
    const anotherUserChannels = await Channel.find({ createdBy: savedAnotherUser._id });
    expect(anotherUserChannels.length).toBe(1);
    expect(anotherUserChannels[0].youtubeId).toBe('UC_another_user');
  });
});