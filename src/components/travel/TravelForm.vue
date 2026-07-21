<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useTravelStore } from '@/stores/useTravelStore'
import MapPicker from '@/components/map/MapPicker.vue'

const emit = defineEmits<{ saved: [] }>()
const travelStore = useTravelStore()

const saving = ref(false)
const showMapPicker = ref(false)
const coverUrl = ref<string | null>(null)
const coverFile = ref<File | null>(null)
const formEl = ref<HTMLElement | null>(null)
const mapSectionEl = ref<HTMLElement | null>(null)

// 地图展开时滚动到地图位置
watch(showMapPicker, async (show) => {
  if (show) {
    await nextTick()
    if (formEl.value && mapSectionEl.value) {
      formEl.value.scrollTo({ top: mapSectionEl.value.offsetTop - 16, behavior: 'smooth' })
    }
  }
})

function handleCoverSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file || !file.type.startsWith('image/')) {
    coverFile.value = null
    return
  }
  coverFile.value = file
  const reader = new FileReader()
  // reader.onload = () => { coverUrl.value = reader.result as string }
  // reader.readAsDataURL(file)
  coverUrl.value = URL.createObjectURL(file)//立即显示，不占用额外内存
}

function removeCover() { coverUrl.value = null }

const countryEmojis: Record<string, string> = {
  CN: '🇨🇳', JP: '🇯🇵', FR: '🇫🇷', TH: '🇹🇭', IT: '🇮🇹', AU: '🇦🇺',
  US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', ES: '🇪🇸', KR: '🇰🇷', SG: '🇸🇬',
}

const presetTags = ['🏖️ 海滩', '🏔️ 登山', '🍜 美食', '🏛️ 文化', '🛍️ 购物', '🎢 游乐园', '🌃 夜景', '🚗 自驾', '🏕️ 露营', '♨️ 温泉']

const form = ref({
  title: '',
  country: '',
  countryCode: '',
  city: '',
  lat: 0,
  lng: 0,
  startDate: '',
  endDate: '',
  story: '',
  tags: [] as string[],
  customTagInput: '',
})

function onMapPicked(pos: { lat: number; lng: number; name: string }) {
  form.value.lat = pos.lat
  form.value.lng = pos.lng
}

function addTag(tag: string) {
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  form.value.customTagInput = ''
}

function removeTag(tag: string) {
  form.value.tags = form.value.tags.filter((t) => t !== tag)
}

function setCountryCode(code: string) {
  form.value.countryCode = code
}

async function handleSave() {
  if (!form.value.title.trim()) return
  saving.value = true
  travelStore.addTravel({
    title: form.value.title,
    country: form.value.country || '未知',
    countryCode: form.value.countryCode || '',
    city: form.value.city || '',
    lat: form.value.lat,
    lng: form.value.lng,
    startDate: form.value.startDate || new Date().toISOString().slice(0, 10),
    endDate: form.value.endDate || new Date().toISOString().slice(0, 10),
    story: form.value.story,
    tags: form.value.tags,
    coverUrl: coverUrl.value || undefined
  }, coverFile.value)
  saving.value = false
  emit('saved')
}
</script>

<template>
  <div ref="formEl" class="travel-form">
    <!-- 封面选择 -->
    <div class="form-group">
      <label>🖼️ 相册封面</label>
      <div class="cover-area">
        <div v-if="coverUrl" class="cover-preview">
          <img :src="coverUrl" alt="封面预览" />
          <button class="cover-remove" @click="removeCover">✕</button>
        </div>
        <label v-else class="cover-upload">
          <span>📷 选择封面图片</span>
          <input type="file" accept="image/*" @change="handleCoverSelect" />
        </label>
      </div>
    </div>

    <div class="form-group">
      <label>🏷️ 旅行标题 *</label>
      <input v-model="form.title" placeholder="给这次旅行起个名字吧~" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>🌍 国家</label>
        <input v-model="form.country" placeholder="如：中国" />
      </div>
      <div class="form-group">
        <label>🏙️ 城市</label>
        <input v-model="form.city" placeholder="如：上海" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>📅 开始日期</label>
        <input v-model="form.startDate" type="date" />
      </div>
      <div class="form-group">
        <label>📅 结束日期</label>
        <input v-model="form.endDate" type="date" />
      </div>
    </div>

    <div ref="mapSectionEl" class="form-group">
      <label>📍 旅行地点</label>
      <button class="map-pick-btn" @click="showMapPicker = !showMapPicker">
        🗺️ {{ showMapPicker ? '收起地图' : '在地图上选择位置' }}
      </button>
      <transition name="fade">
        <MapPicker v-if="showMapPicker" height="220px" @update:model-value="onMapPicked" />
      </transition>
      <span v-if="form.lat" class="coord-info">
        📌 已选坐标：{{ form.lat.toFixed(4) }}, {{ form.lng.toFixed(4) }}
      </span>
    </div>

    <div class="form-group">
      <label>💬 旅行故事</label>
      <textarea v-model="form.story" rows="3" placeholder="记录这次旅行的故事~"></textarea>
    </div>

    <div class="form-group">
      <label>🏷️ 标签</label>
      <div class="tag-suggestions">
        <button v-for="tag in presetTags" :key="tag" class="tag-suggestion-chip"
          :class="{ used: form.tags.includes(tag) }" :disabled="form.tags.includes(tag)" @click="addTag(tag)">
          {{ tag }}
        </button>
      </div>
      <div v-if="form.tags.length" class="tag-input-row">
        <span v-for="tag in form.tags" :key="tag" class="tag-chip-inline">
          {{ tag }} <button @click="removeTag(tag)">✕</button>
        </span>
      </div>
      <!-- <input v-model="form.customTagInput" placeholder="输入标签后回车" @keyup.enter="addTag(form.customTagInput)" /> -->
    </div>

    <button class="save-btn" :disabled="saving || !form.title.trim()" @click="handleSave">
      {{ saving ? '✈️ 保存中...' : '✨ 保存旅行' }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.travel-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
}

.cover-area {
  margin-bottom: 4px;
}

.cover-preview {
  position: relative;
  width: 100%;
  height: 140px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid var(--border-color, rgba(0, 0, 0, 0.08));

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-remove {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #ff4444;
    }
  }
}

.cover-upload {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100px;
  border: 2px dashed rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: #999;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  input {
    display: none;
  }
}

.form-group {
  margin-bottom: 14px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  input,
  textarea {
    width: 100%;
    padding: 10px 14px;
    border: 2px solid var(--border-color, rgba(0, 0, 0, 0.08));
    border-radius: 8px;
    font-size: 13px;
    font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    background: rgba(0, 0, 0, 0.02);

    &:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  }

  textarea {
    resize: vertical;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.map-pick-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover {
    border-color: var(--primary-color);
  }
}

.coord-info {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

.tag-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tag-suggestion-chip {
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.04);
  border: 1.5px solid var(--border-color, rgba(0, 0, 0, 0.08));
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary, #666);
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover:not(:disabled) {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: rgba(255, 107, 138, 0.06);
  }

  &.used {
    opacity: 0.4;
    cursor: default;
  }
}

.tag-input-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid var(--border-color, rgba(0, 0, 0, 0.08));
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
  margin-bottom: 8px;
  min-height: 38px;
}

.tag-chip-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    font-size: 13px;
    padding: 0;
  }
}

.save-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 8px;
  font-family: 'Nunito', 'Noto Sans SC', sans-serif;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.7;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
