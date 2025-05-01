import mongoose from 'mongoose';
import { Video, VideoDocument } from '../video.model';
import { Channel } from '../channel.model';
import { Playlist } from '../playlist.model';
import { UserModel } from '../user.model';

// Use in-memory MongoDB instance setup in setup.ts

describe('Video Model', () => {
  // Reference to test user, channel, and playlist IDs
  let testUserId: mongoose.Types.ObjectId;
  let testChannelId: mongoose.Types.ObjectId;
  let testPlaylistId: mongoose.Types.ObjectId;

  // Test data
  const videoData = {
    youtubeId: 'v12345abcde',
    title: 'Test Video',
    description: 'A test video for unit tests',
    thumbnailUrl: 'https://example.com/video-thumbnail.jpg',
    duration: 360, // 6 minutes in seconds
    viewCount: 10000,
    likeCount: 500,
    publishedAt: new Date('2022-03-15'),
    tags: ['test', 'unit test', 'video'],
    isArchived: false,
    archiveStatus: 'pending' as const,
    hasSubtitles: false,
  };

  // Setup test user, channel, and playlist before running tests
  beforeAll(async () => {
    // Create a test user
    const user = new UserModel({
      username: 'videotester',
      email: 'video@example.com',
      password: 'password123',
    });
    const savedUser = await user.save();
    testUserId = savedUser._id as mongoose.Types.ObjectId;

    // Create a test channel
    const channel = new Channel({
      youtubeId: 'UC_video_test',
      name: 'Video Test Channel',
      createdBy: testUserId,
    });
    const savedChannel = await channel.save();
    testChannelId = savedChannel._id as mongoose.Types.ObjectId;

    // Create a test playlist
    const playlist = new Playlist({
      youtubeId: 'PL_video_test',
      title: 'Video Test Playlist',
      channelId: testChannelId,
      createdBy: testUserId,
    });
    const savedPlaylist = await playlist.save();
    testPlaylistId = savedPlaylist._id as mongoose.Types.ObjectId;
  });

  // Clean up after tests
  afterAll(async () => {
    await Video.deleteMany({});
    await Playlist.deleteMany({});
    await Channel.deleteMany({});
    await UserModel.deleteMany({});
  });

  it('should create a new video successfully with all fields', async () => {
    const video = new Video({
      ...videoData,
      channelId: testChannelId,
      playlistId: testPlaylistId,
      fileSize: 1024 * 1024 * 50, // 50MB
      filePath: '/videos/test-video.mp4',
      fileUrl: 'https://example.com/videos/test-video.mp4',
      format: 'mp4',
      quality: '720p',
      subtitleLanguages: ['en', 'es', 'fr'],
      metadataPath: '/metadata/test-video.json',
    });
    
    const savedVideo = await video.save();
    
    // Check all fields
    expect(savedVideo._id).toBeDefined();
    expect(savedVideo.youtubeId).toBe(videoData.youtubeId);
    expect(savedVideo.title).toBe(videoData.title);
    expect(savedVideo.description).toBe(videoData.description);
    expect(savedVideo.thumbnailUrl).toBe(videoData.thumbnailUrl);
    expect(savedVideo.duration).toBe(videoData.duration);
    expect(savedVideo.viewCount).toBe(videoData.viewCount);
    expect(savedVideo.likeCount).toBe(videoData.likeCount);
    expect(savedVideo.publishedAt?.toISOString()).toBe(videoData.publishedAt.toISOString());
    expect(savedVideo.tags).toEqual(videoData.tags);
    expect(savedVideo.channelId.toString()).toBe(testChannelId.toString());
    expect(savedVideo.playlistId?.toString()).toBe(testPlaylistId.toString());
    expect(savedVideo.isArchived).toBe(videoData.isArchived);
    expect(savedVideo.archiveStatus).toBe(videoData.archiveStatus);
    expect(savedVideo.fileSize).toBe(1024 * 1024 * 50);
    expect(savedVideo.filePath).toBe('/videos/test-video.mp4');
    expect(savedVideo.fileUrl).toBe('https://example.com/videos/test-video.mp4');
    expect(savedVideo.format).toBe('mp4');
    expect(savedVideo.quality).toBe('720p');
    expect(savedVideo.hasSubtitles).toBe(false);
    expect(savedVideo.subtitleLanguages).toEqual(['en', 'es', 'fr']);
    expect(savedVideo.metadataPath).toBe('/metadata/test-video.json');
    expect(savedVideo.createdAt).toBeDefined();
    expect(savedVideo.updatedAt).toBeDefined();
  });

  it('should create a video with only required fields', async () => {
    // Minimal video with only required fields
    const minimalVideo = new Video({
      youtubeId: 'v_minimal_test',
      title: 'Minimal Video',
      channelId: testChannelId,
    });
    
    const savedVideo = await minimalVideo.save();
    
    // Check required fields
    expect(savedVideo.youtubeId).toBe('v_minimal_test');
    expect(savedVideo.title).toBe('Minimal Video');
    expect(savedVideo.channelId.toString()).toBe(testChannelId.toString());
    
    // Check default values
    expect(savedVideo.isArchived).toBe(false);
    expect(savedVideo.archiveStatus).toBe('pending');
    expect(savedVideo.hasSubtitles).toBe(false);
    
    // Optional fields should be undefined
    expect(savedVideo.playlistId).toBeUndefined();
    expect(savedVideo.description).toBeUndefined();
    expect(savedVideo.duration).toBeUndefined();
    expect(savedVideo.fileSize).toBeUndefined();
  });

  it('should require youtubeId, title, and channelId fields', async () => {
    // Test without youtubeId
    const videoWithoutYoutubeId = new Video({
      title: 'Missing YoutubeId',
      channelId: testChannelId,
    });

    // Test without title
    const videoWithoutTitle = new Video({
      youtubeId: 'v_no_title',
      channelId: testChannelId,
    });

    // Test without channelId
    const videoWithoutChannelId = new Video({
      youtubeId: 'v_no_channel',
      title: 'Missing Channel',
    });

    // Validate each case
    await expect(videoWithoutYoutubeId.validate()).rejects.toThrow();
    await expect(videoWithoutTitle.validate()).rejects.toThrow();
    await expect(videoWithoutChannelId.validate()).rejects.toThrow();
  });

  it('should not allow duplicate youtubeId', async () => {
    // First create a video
    await new Video({
      youtubeId: 'v_duplicate_test',
      title: 'Original Video',
      channelId: testChannelId,
    }).save();
    
    // Try to create another video with the same youtubeId
    const duplicateVideo = new Video({
      youtubeId: 'v_duplicate_test',
      title: 'Duplicate Video',
      channelId: testChannelId,
    });
    
    // This should fail due to unique constraint
    await expect(duplicateVideo.save()).rejects.toThrow();
  });

  it('should only allow valid enum values for archiveStatus', async () => {
    // Valid values
    const validStatuses = ['pending', 'downloading', 'completed', 'failed'];
    
    // Test each valid value
    for (const status of validStatuses) {
      const video = new Video({
        youtubeId: `v_${status}_${Date.now()}`,
        title: `${status} Status Video`,
        channelId: testChannelId,
        archiveStatus: status as 'pending' | 'downloading' | 'completed' | 'failed',
      });
      
      const savedVideo = await video.save();
      expect(savedVideo.archiveStatus).toBe(status);
    }
    
    // Test invalid value
    const videoWithInvalidStatus = new Video({
      youtubeId: 'v_invalid_status',
      title: 'Invalid Status Video',
      channelId: testChannelId,
      archiveStatus: 'invalid' as any, // Intentionally testing an invalid value
    });
    
    await expect(videoWithInvalidStatus.validate()).rejects.toThrow();
  });

  it('should support array fields for tags and subtitleLanguages', async () => {
    const video = new Video({
      youtubeId: 'v_array_fields',
      title: 'Array Fields Video',
      channelId: testChannelId,
      tags: ['javascript', 'tutorial', 'programming'],
      subtitleLanguages: ['en', 'de', 'jp'],
    });
    
    const savedVideo = await video.save();
    
    // Check array fields
    expect(savedVideo.tags).toEqual(['javascript', 'tutorial', 'programming']);
    expect(savedVideo.subtitleLanguages).toEqual(['en', 'de', 'jp']);
  });

  it('should update video download information successfully', async () => {
    // Create a video
    const video = new Video({
      youtubeId: 'v_download_update',
      title: 'Video Before Download',
      channelId: testChannelId,
      archiveStatus: 'pending',
    });
    
    const savedVideo = await video.save();
    
    // Update with download information
    const downloadDate = new Date();
    savedVideo.archiveStatus = 'completed';
    savedVideo.isArchived = true;
    savedVideo.downloadedAt = downloadDate;
    savedVideo.fileSize = 1024 * 1024 * 100; // 100MB
    savedVideo.filePath = '/videos/downloaded.mp4';
    savedVideo.fileUrl = 'https://example.com/videos/downloaded.mp4';
    savedVideo.format = 'mp4';
    savedVideo.quality = '1080p';
    savedVideo.hasSubtitles = true;
    savedVideo.subtitleLanguages = ['en'];
    
    const updatedVideo = await savedVideo.save();
    
    // Check updated values
    expect(updatedVideo.archiveStatus).toBe('completed');
    expect(updatedVideo.isArchived).toBe(true);
    expect(updatedVideo.downloadedAt?.toISOString()).toBe(downloadDate.toISOString());
    expect(updatedVideo.fileSize).toBe(1024 * 1024 * 100);
    expect(updatedVideo.filePath).toBe('/videos/downloaded.mp4');
    expect(updatedVideo.fileUrl).toBe('https://example.com/videos/downloaded.mp4');
    expect(updatedVideo.format).toBe('mp4');
    expect(updatedVideo.quality).toBe('1080p');
    expect(updatedVideo.hasSubtitles).toBe(true);
    expect(updatedVideo.subtitleLanguages).toEqual(['en']);
  });

  it('should update failed download information', async () => {
    // Create a video
    const video = new Video({
      youtubeId: 'v_download_fail',
      title: 'Video Download Failed',
      channelId: testChannelId,
      archiveStatus: 'downloading',
    });
    
    const savedVideo = await video.save();
    
    // Update with failure information
    savedVideo.archiveStatus = 'failed';
    savedVideo.errorMessage = 'Download failed: Network error';
    
    const updatedVideo = await savedVideo.save();
    
    // Check updated values
    expect(updatedVideo.archiveStatus).toBe('failed');
    expect(updatedVideo.errorMessage).toBe('Download failed: Network error');
  });

  it('should find videos by text search on title, description, and tags', async () => {
    // Create test videos with searchable text
    await Promise.all([
      new Video({
        youtubeId: 'v_search_test1',
        title: 'How to Build React Applications',
        description: 'Learn React fundamentals',
        tags: ['react', 'javascript', 'tutorial'],
        channelId: testChannelId,
      }).save(),
      
      new Video({
        youtubeId: 'v_search_test2',
        title: 'JavaScript Performance Tips',
        description: 'Optimize your React applications',
        tags: ['javascript', 'performance', 'optimization'],
        channelId: testChannelId,
      }).save(),
      
      new Video({
        youtubeId: 'v_search_test3',
        title: 'Python for Beginners',
        description: 'Learn Python programming',
        tags: ['python', 'tutorial', 'programming'],
        channelId: testChannelId,
      }).save(),
    ]);
    
    // Test text search for "react"
    const reactResults = await Video.find(
      { $text: { $search: 'react' } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    
    // Should find videos with "react" in title, description, or tags
    expect(reactResults.length).toBe(2);
    expect(reactResults.map(v => v.youtubeId)).toContain('v_search_test1');
    expect(reactResults.map(v => v.youtubeId)).toContain('v_search_test2');
    
    // Video with "react" in title should have higher relevance
    expect(reactResults[0].youtubeId).toBe('v_search_test1');
    
    // Test text search for "tutorial"
    const tutorialResults = await Video.find(
      { $text: { $search: 'tutorial' } },
      { score: { $meta: 'textScore' } }
    );
    
    // Should find videos with "tutorial" in tags
    expect(tutorialResults.length).toBe(2);
    expect(tutorialResults.map(v => v.youtubeId)).toContain('v_search_test1');
    expect(tutorialResults.map(v => v.youtubeId)).toContain('v_search_test3');
  });

  it('should find videos by channelId and playlistId', async () => {
    // Create another playlist
    const anotherPlaylist = new Playlist({
      youtubeId: 'PL_another_test',
      title: 'Another Test Playlist',
      channelId: testChannelId,
      createdBy: testUserId,
    });
    const savedAnotherPlaylist = await anotherPlaylist.save();
    
    // Create videos with different playlist associations
    await Promise.all([
      new Video({
        youtubeId: 'v_playlist1',
        title: 'Video in Playlist 1',
        channelId: testChannelId,
        playlistId: testPlaylistId,
      }).save(),
      
      new Video({
        youtubeId: 'v_playlist2',
        title: 'Video in Playlist 2',
        channelId: testChannelId,
        playlistId: savedAnotherPlaylist._id,
      }).save(),
      
      new Video({
        youtubeId: 'v_no_playlist',
        title: 'Video without Playlist',
        channelId: testChannelId,
      }).save(),
    ]);
    
    // Query videos by channelId
    const channelVideos = await Video.find({ channelId: testChannelId });
    expect(channelVideos.length).toBeGreaterThan(2);
    
    // Query videos by playlistId
    const playlistVideos = await Video.find({ playlistId: testPlaylistId });
    expect(playlistVideos.length).toBe(1);
    expect(playlistVideos[0].youtubeId).toBe('v_playlist1');
    
    // Query videos by channelId and playlistId
    const specificVideos = await Video.find({
      channelId: testChannelId,
      playlistId: savedAnotherPlaylist._id,
    });
    expect(specificVideos.length).toBe(1);
    expect(specificVideos[0].youtubeId).toBe('v_playlist2');
    
    // Query videos without playlistId
    const noPlaylistVideos = await Video.find({
      channelId: testChannelId,
      playlistId: { $exists: false },
    });
    expect(noPlaylistVideos.length).toBe(1);
    expect(noPlaylistVideos[0].youtubeId).toBe('v_no_playlist');
  });

  it('should find videos by archive status', async () => {
    // Create videos with different archive statuses
    await Promise.all([
      new Video({
        youtubeId: 'v_status_pending',
        title: 'Pending Video',
        channelId: testChannelId,
        isArchived: false,
        archiveStatus: 'pending',
      }).save(),
      
      new Video({
        youtubeId: 'v_status_downloading',
        title: 'Downloading Video',
        channelId: testChannelId,
        isArchived: false,
        archiveStatus: 'downloading',
      }).save(),
      
      new Video({
        youtubeId: 'v_status_completed',
        title: 'Completed Video',
        channelId: testChannelId,
        isArchived: true,
        archiveStatus: 'completed',
      }).save(),
      
      new Video({
        youtubeId: 'v_status_failed',
        title: 'Failed Video',
        channelId: testChannelId,
        isArchived: false,
        archiveStatus: 'failed',
      }).save(),
    ]);
    
    // Query by isArchived
    const archivedVideos = await Video.find({ isArchived: true });
    expect(archivedVideos.length).toBeGreaterThan(0);
    expect(archivedVideos.every(v => v.archiveStatus === 'completed')).toBe(true);
    
    // Query by archiveStatus
    const pendingVideos = await Video.find({ archiveStatus: 'pending' });
    expect(pendingVideos.length).toBeGreaterThan(0);
    expect(pendingVideos.map(v => v.youtubeId)).toContain('v_status_pending');
    
    const failedVideos = await Video.find({ archiveStatus: 'failed' });
    expect(failedVideos.length).toBeGreaterThan(0);
    expect(failedVideos.map(v => v.youtubeId)).toContain('v_status_failed');
    
    // Query by combined filters
    const downloadingNotArchived = await Video.find({
      isArchived: false,
      archiveStatus: 'downloading',
    });
    expect(downloadingNotArchived.length).toBe(1);
    expect(downloadingNotArchived[0].youtubeId).toBe('v_status_downloading');
  });

  it('should find videos by publishedAt date range', async () => {
    // Create videos with different published dates
    await Promise.all([
      new Video({
        youtubeId: 'v_date_2020',
        title: 'Video from 2020',
        channelId: testChannelId,
        publishedAt: new Date('2020-01-15'),
      }).save(),
      
      new Video({
        youtubeId: 'v_date_2021',
        title: 'Video from 2021',
        channelId: testChannelId,
        publishedAt: new Date('2021-06-20'),
      }).save(),
      
      new Video({
        youtubeId: 'v_date_2022',
        title: 'Video from 2022',
        channelId: testChannelId,
        publishedAt: new Date('2022-11-10'),
      }).save(),
    ]);
    
    // Query videos from 2021 and later
    const recentVideos = await Video.find({
      publishedAt: { $gte: new Date('2021-01-01') },
    }).sort({ publishedAt: -1 });
    
    expect(recentVideos.length).toBeGreaterThan(1);
    expect(recentVideos.map(v => v.youtubeId)).toContain('v_date_2021');
    expect(recentVideos.map(v => v.youtubeId)).toContain('v_date_2022');
    expect(recentVideos.map(v => v.youtubeId)).not.toContain('v_date_2020');
    
    // Check descending sort order (newest first)
    expect(recentVideos[0].youtubeId).toBe('v_date_2022');
    expect(recentVideos[1].youtubeId).toBe('v_date_2021');
  });
});