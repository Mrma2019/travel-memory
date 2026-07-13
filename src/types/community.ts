/** 社区帖子 */
export interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  title: string
  content: string
  story: string
  photoUrl: string
  thumbnailUrl: string
  /** 多张照片（用于轮播），为空或单元素时仅展示 photoUrl */
  photos?: string[]
  location: string
  tags: string[]
  likes: number
  likedBy: string[]     // userId[]
  comments: CommunityComment[]
  createdAt: string
  publishedAt: string
}

export interface CommunityComment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: string
}
