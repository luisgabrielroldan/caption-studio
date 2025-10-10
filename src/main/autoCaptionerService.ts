import { ipcMain } from 'electron'
import { readFile } from 'fs/promises'
import { getStore } from './config'
import OpenAI from 'openai'

interface AutoCaptionerConfig {
  provider: 'custom' | 'chatgpt'
  systemPrompt: string
  temperature: number
  maxTokens: number
  custom: {
    baseUrl: string
    modelName: string
  }
  chatgpt: {
    apiKey: string
    modelName: string
  }
}

/**
 * Convert image file to base64 data URL
 */
async function imageToBase64DataUrl(imagePath: string): Promise<string> {
  const buffer = await readFile(imagePath)
  const base64 = buffer.toString('base64')

  // Determine mime type from extension
  let mimeType = 'image/jpeg'
  const ext = imagePath.toLowerCase()
  if (ext.endsWith('.png')) {
    mimeType = 'image/png'
  } else if (ext.endsWith('.webp')) {
    mimeType = 'image/webp'
  } else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) {
    mimeType = 'image/jpeg'
  }

  return `data:${mimeType};base64,${base64}`
}

/**
 * Create OpenAI client instance based on provider configuration
 */
function createOpenAIClient(config: AutoCaptionerConfig): { client: OpenAI; modelName: string } {
  const { provider, custom, chatgpt } = config

  if (provider === 'custom') {
    const { baseUrl, modelName } = custom

    if (!baseUrl || !modelName) {
      throw new Error('Custom provider requires both baseUrl and modelName to be configured')
    }

    // Create OpenAI client with custom base URL
    // No API key needed for local providers like Ollama
    const client = new OpenAI({
      baseURL: baseUrl,
      apiKey: 'not-needed' // Required by SDK but not used by local providers
    })

    return { client, modelName }
  } else if (provider === 'chatgpt') {
    const { apiKey, modelName } = chatgpt

    if (!apiKey) {
      throw new Error('ChatGPT provider requires an API key to be configured')
    }

    if (!modelName) {
      throw new Error('ChatGPT provider requires a model name to be configured')
    }

    // Create OpenAI client with official API
    const client = new OpenAI({
      apiKey
    })

    return { client, modelName }
  } else {
    throw new Error(`Provider "${provider}" is not supported`)
  }
}

/**
 * Call OpenAI-compatible API for image captioning using official SDK
 */
async function callVisionAPI(imageDataUrl: string, config: AutoCaptionerConfig): Promise<string> {
  const { systemPrompt, provider, temperature, maxTokens } = config

  console.log(`[AutoCaptioner] Provider: ${provider}`)

  // Create OpenAI client
  const { client, modelName } = createOpenAIClient(config)

  console.log(`[AutoCaptioner] Model: ${modelName}`)
  console.log(`[AutoCaptioner] Temperature: ${temperature}, Max Tokens: ${maxTokens}`)

  try {
    // Call the chat completions API with vision support
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        {
          role: 'user' as const,
          content: [
            {
              type: 'image_url' as const,
              image_url: {
                url: imageDataUrl
              }
            }
          ]
        }
      ],
      max_tokens: maxTokens,
      temperature
    })

    console.log(`[AutoCaptioner] Response received successfully`)

    // Extract caption from response
    const caption = response.choices[0]?.message?.content

    if (!caption) {
      throw new Error('API response did not contain caption text')
    }

    return caption.trim()
  } catch (error) {
    console.error(`[AutoCaptioner] Error calling vision API:`, error)

    // Provide more helpful error messages
    if (error instanceof Error) {
      throw new Error(`Failed to generate caption: ${error.message}`)
    }

    throw error
  }
}

/**
 * Generate caption for a single image
 */
async function captionImage(imagePath: string, config: AutoCaptionerConfig): Promise<string> {
  // Convert image to base64
  const imageDataUrl = await imageToBase64DataUrl(imagePath)

  // Call vision API
  const caption = await callVisionAPI(imageDataUrl, config)

  return caption
}

/**
 * Generate captions for multiple images (batch)
 * Currently processes sequentially, but designed for future parallel processing
 * Note: Not currently used but kept for future batch processing feature
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - Function reserved for future batch processing feature
async function captionImages(imagePaths: string[], config: AutoCaptionerConfig): Promise<string[]> {
  const captions: string[] = []

  for (const imagePath of imagePaths) {
    const caption = await captionImage(imagePath, config)
    captions.push(caption)
  }

  return captions
}

/**
 * Register IPC handlers for auto-captioner
 */
export function registerAutoCaptionerHandlers(): void {
  // Generate caption for single image
  ipcMain.handle('auto-caption:generate', async (_event, imagePath: string) => {
    try {
      const store = await getStore()
      const config = store.get('autoCaptioner') as AutoCaptionerConfig

      if (!config) {
        throw new Error('Auto-captioner is not configured')
      }

      const caption = await captionImage(imagePath, config)
      return caption
    } catch (error) {
      console.error('Error generating caption:', error)
      throw error
    }
  })
}
