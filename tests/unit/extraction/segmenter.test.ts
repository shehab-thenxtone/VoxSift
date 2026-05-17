import { describe, test, expect } from 'vitest'
import { segmentText } from '../../../src/extraction/segmenter'

describe('segmentText', () => {
  test('splits paragraphs into sentence segments', () => {
    const paragraphs = ['Hello world. This is a test.', 'Second paragraph here.']
    const segments = segmentText(paragraphs, 'en')
    expect(segments.length).toBeGreaterThanOrEqual(2)
    expect(segments[0]?.text).toBeTruthy()
  })

  test('assigns charStart and charEnd correctly', () => {
    const paragraphs = ['One. Two.']
    const segments = segmentText(paragraphs, 'en')
    expect(segments[0]?.charStart).toBe(0)
    expect(segments[1]?.charStart).toBeGreaterThan(0)
  })

  test('assigns unique stable ids', () => {
    const segments = segmentText(['Hello. World.'], 'en')
    const ids = segments.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
