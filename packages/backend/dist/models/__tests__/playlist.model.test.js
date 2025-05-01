"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const playlist_model_1 = require("../playlist.model");
const channel_model_1 = require("../channel.model");
const user_model_1 = require("../user.model");
// Use in-memory MongoDB instance setup in setup.ts
describe('Playlist Model', () => {
    // Reference to test user and channel IDs
    let testUserId;
    let testChannelId;
    // Test data
    const playlistData = {
        youtubeId: 'PL12345abcde',
        title: 'Test Playlist',
        description: 'A test playlist for unit tests',
        thumbnailUrl: 'https://example.com/playlist-thumbnail.jpg',
        itemCount: 25,
        publishedAt: new Date('2021-01-15'),
        isArchived: false,
        archiveStatus: 'none',
    };
    // Setup test user and channel before running tests
    beforeAll(async () => {
        // Create a test user to reference in playlist tests
        const user = new user_model_1.UserModel({
            username: 'playlisttester',
            email: 'playlist@example.com',
            password: 'password123',
        });
        const savedUser = await user.save();
        testUserId = savedUser._id;
        // Create a test channel to reference in playlist tests
        const channel = new channel_model_1.Channel({
            youtubeId: 'UC_playlist_test',
            name: 'Playlist Test Channel',
            createdBy: testUserId,
        });
        const savedChannel = await channel.save();
        testChannelId = savedChannel._id;
    });
    // Clean up after tests
    afterAll(async () => {
        await playlist_model_1.Playlist.deleteMany({});
        await channel_model_1.Channel.deleteMany({});
        await user_model_1.UserModel.deleteMany({});
    });
    it('should create a new playlist successfully', async () => {
        const playlist = new playlist_model_1.Playlist({
            ...playlistData,
            channelId: testChannelId,
            createdBy: testUserId,
        });
        const savedPlaylist = await playlist.save();
        // Check saved playlist
        expect(savedPlaylist._id).toBeDefined();
        expect(savedPlaylist.youtubeId).toBe(playlistData.youtubeId);
        expect(savedPlaylist.title).toBe(playlistData.title);
        expect(savedPlaylist.description).toBe(playlistData.description);
        expect(savedPlaylist.thumbnailUrl).toBe(playlistData.thumbnailUrl);
        expect(savedPlaylist.itemCount).toBe(playlistData.itemCount);
        expect(savedPlaylist.publishedAt?.toISOString()).toBe(playlistData.publishedAt.toISOString());
        expect(savedPlaylist.isArchived).toBe(playlistData.isArchived);
        expect(savedPlaylist.archiveStatus).toBe(playlistData.archiveStatus);
        expect(savedPlaylist.channelId.toString()).toBe(testChannelId.toString());
        expect(savedPlaylist.createdBy.toString()).toBe(testUserId.toString());
        expect(savedPlaylist.createdAt).toBeDefined();
        expect(savedPlaylist.updatedAt).toBeDefined();
    });
    it('should require youtubeId, title, channelId, and createdBy fields', async () => {
        // Test without youtubeId
        const playlistWithoutYoutubeId = new playlist_model_1.Playlist({
            title: playlistData.title,
            channelId: testChannelId,
            createdBy: testUserId,
        });
        // Test without title
        const playlistWithoutTitle = new playlist_model_1.Playlist({
            youtubeId: 'PL67890fghij',
            channelId: testChannelId,
            createdBy: testUserId,
        });
        // Test without channelId
        const playlistWithoutChannelId = new playlist_model_1.Playlist({
            youtubeId: 'PL67890fghij',
            title: playlistData.title,
            createdBy: testUserId,
        });
        // Test without createdBy
        const playlistWithoutCreatedBy = new playlist_model_1.Playlist({
            youtubeId: 'PL67890fghij',
            title: playlistData.title,
            channelId: testChannelId,
        });
        // Validate each case
        await expect(playlistWithoutYoutubeId.validate()).rejects.toThrow();
        await expect(playlistWithoutTitle.validate()).rejects.toThrow();
        await expect(playlistWithoutChannelId.validate()).rejects.toThrow();
        await expect(playlistWithoutCreatedBy.validate()).rejects.toThrow();
    });
    it('should not allow duplicate youtubeId', async () => {
        // First create a playlist
        await new playlist_model_1.Playlist({
            youtubeId: 'PL98765zyxwv',
            title: 'Original Playlist',
            channelId: testChannelId,
            createdBy: testUserId,
        }).save();
        // Try to create another playlist with the same youtubeId
        const duplicatePlaylist = new playlist_model_1.Playlist({
            youtubeId: 'PL98765zyxwv',
            title: 'Duplicate Playlist',
            channelId: testChannelId,
            createdBy: testUserId,
        });
        // This should fail due to unique constraint
        await expect(duplicatePlaylist.save()).rejects.toThrow();
    });
    it('should set default values correctly', async () => {
        const playlistWithDefaults = new playlist_model_1.Playlist({
            youtubeId: 'PL24680rstuvw',
            title: 'Default Values Playlist',
            channelId: testChannelId,
            createdBy: testUserId,
        });
        const savedPlaylist = await playlistWithDefaults.save();
        // Check default values
        expect(savedPlaylist.isArchived).toBe(false);
        expect(savedPlaylist.archiveStatus).toBe('none');
    });
    it('should only allow valid enum values for archiveStatus', async () => {
        // Valid values
        const validStatuses = ['none', 'partial', 'complete'];
        // Test each valid value
        for (const status of validStatuses) {
            const playlist = new playlist_model_1.Playlist({
                youtubeId: `PL_${status}_${Date.now()}`,
                title: `${status} Status Playlist`,
                archiveStatus: status,
                channelId: testChannelId,
                createdBy: testUserId,
            });
            const savedPlaylist = await playlist.save();
            expect(savedPlaylist.archiveStatus).toBe(status);
        }
        // Test invalid value
        const playlistWithInvalidStatus = new playlist_model_1.Playlist({
            youtubeId: 'PL_invalid_status',
            title: 'Invalid Status Playlist',
            archiveStatus: 'invalid', // Intentionally testing an invalid value
            channelId: testChannelId,
            createdBy: testUserId,
        });
        await expect(playlistWithInvalidStatus.validate()).rejects.toThrow();
    });
    it('should update a playlist successfully', async () => {
        // Create a playlist
        const playlist = new playlist_model_1.Playlist({
            youtubeId: 'PL_update_test',
            title: 'Playlist Before Update',
            itemCount: 10,
            channelId: testChannelId,
            createdBy: testUserId,
        });
        const savedPlaylist = await playlist.save();
        // Update the playlist
        savedPlaylist.title = 'Playlist After Update';
        savedPlaylist.itemCount = 15;
        savedPlaylist.isArchived = true;
        savedPlaylist.archiveStatus = 'partial';
        const updatedPlaylist = await savedPlaylist.save();
        // Check updated values
        expect(updatedPlaylist.title).toBe('Playlist After Update');
        expect(updatedPlaylist.itemCount).toBe(15);
        expect(updatedPlaylist.isArchived).toBe(true);
        expect(updatedPlaylist.archiveStatus).toBe('partial');
        // The updatedAt field should change
        expect(updatedPlaylist.updatedAt).not.toEqual(savedPlaylist.updatedAt);
    });
    it('should find playlists by text search on title and description', async () => {
        // Create test playlists with searchable text
        await Promise.all([
            new playlist_model_1.Playlist({
                youtubeId: 'PL_search_test1',
                title: 'Beginner Guitar Lessons',
                description: 'Learn to play guitar from scratch',
                channelId: testChannelId,
                createdBy: testUserId,
            }).save(),
            new playlist_model_1.Playlist({
                youtubeId: 'PL_search_test2',
                title: 'Advanced Music Theory',
                description: 'Deep dive into guitar techniques and music theory',
                channelId: testChannelId,
                createdBy: testUserId,
            }).save(),
            new playlist_model_1.Playlist({
                youtubeId: 'PL_search_test3',
                title: 'Piano Tutorials',
                description: 'Learn to play piano',
                channelId: testChannelId,
                createdBy: testUserId,
            }).save(),
        ]);
        // Test text search
        const guitarResults = await playlist_model_1.Playlist.find({ $text: { $search: 'guitar' } }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
        // Should find both playlists with "guitar" in title or description
        expect(guitarResults.length).toBe(2);
        expect(guitarResults.map(p => p.youtubeId)).toContain('PL_search_test1');
        expect(guitarResults.map(p => p.youtubeId)).toContain('PL_search_test2');
        // Relevance should put the one with guitar in the title first
        expect(guitarResults[0].youtubeId).toBe('PL_search_test1');
    });
    it('should find playlists by channelId', async () => {
        // Create another channel
        const anotherChannel = new channel_model_1.Channel({
            youtubeId: 'UC_another_channel',
            name: 'Another Channel',
            createdBy: testUserId,
        });
        const savedAnotherChannel = await anotherChannel.save();
        // Create a playlist for another channel
        await new playlist_model_1.Playlist({
            youtubeId: 'PL_another_channel',
            title: 'Another Channel Playlist',
            channelId: savedAnotherChannel._id,
            createdBy: testUserId,
        }).save();
        // Query playlists by test channel
        const channelPlaylists = await playlist_model_1.Playlist.find({ channelId: testChannelId });
        // Count should be all previously created playlists for test channel
        expect(channelPlaylists.length).toBeGreaterThan(0);
        expect(channelPlaylists.every(p => p.youtubeId !== 'PL_another_channel')).toBe(true);
        // Query playlists by the other channel
        const anotherChannelPlaylists = await playlist_model_1.Playlist.find({ channelId: savedAnotherChannel._id });
        expect(anotherChannelPlaylists.length).toBe(1);
        expect(anotherChannelPlaylists[0].youtubeId).toBe('PL_another_channel');
    });
    it('should find playlists by createdBy and channelId combination', async () => {
        // Create another user
        const anotherUser = new user_model_1.UserModel({
            username: 'anotherpluser',
            email: 'anotherpl@example.com',
            password: 'password123',
        });
        const savedAnotherUser = await anotherUser.save();
        // Create playlists with different combinations of channelId and createdBy
        await new playlist_model_1.Playlist({
            youtubeId: 'PL_combo_1',
            title: 'Same Channel Different User',
            channelId: testChannelId,
            createdBy: savedAnotherUser._id,
        }).save();
        // Query playlists by both criteria
        const results = await playlist_model_1.Playlist.find({
            channelId: testChannelId,
            createdBy: testUserId,
        });
        // Should find playlists matching both criteria
        expect(results.length).toBeGreaterThan(0);
        // Should not include the playlist created by another user
        expect(results.every(p => p.youtubeId !== 'PL_combo_1')).toBe(true);
    });
});
//# sourceMappingURL=playlist.model.test.js.map