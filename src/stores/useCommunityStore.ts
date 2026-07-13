import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CommunityPost, CommunityComment } from '@/types/community'
import mockPosts from '@/mock/community.json'

const STORAGE_KEY = 'travel-memory-community'

export const useCommunityStore = defineStore('community', () => {
  const posts = ref<CommunityPost[]>([])

  function init() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const saved = JSON.parse(stored) as CommunityPost[]
        // 合并 mock 和 localStorage
        const savedIds = new Set(saved.map((p) => p.id))
        posts.value = [...(mockPosts as CommunityPost[]), ...saved.filter((p) => !mockPosts.some((m) => m.id === p.id))]
        return
      } catch { /* ignore */ }
    }
    posts.value = mockPosts as CommunityPost[]
  }

  // 发帖
  function publish(post: Omit<CommunityPost, 'id' | 'likes' | 'likedBy' | 'comments' | 'publishedAt'>) {
    const newPost: CommunityPost = {
      ...post,
      id: 'post-user-' + Date.now(),
      likes: 0,
      likedBy: [],
      comments: [],
      publishedAt: new Date().toISOString(),
    }
    posts.value.unshift(newPost)
    save()
  }

  // 点赞
  function toggleLike(postId: string, userId: string) {
    const p = posts.value.find((p) => p.id === postId)
    if (!p) return
    if (p.likedBy.includes(userId)) {
      p.likedBy = p.likedBy.filter((id) => id !== userId)
      p.likes--
    } else {
      p.likedBy.push(userId)
      p.likes++
    }
    save()
  }

  // 评论
  function addComment(postId: string, comment: Omit<CommunityComment, 'id' | 'createdAt'>) {
    const p = posts.value.find((p) => p.id === postId)
    if (!p) return
    p.comments.push({
      ...comment,
      id: 'cmt-user-' + Date.now(),
      createdAt: new Date().toISOString(),
    })
    save()
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts.value))
  }

  return { posts, init, publish, toggleLike, addComment }
})
