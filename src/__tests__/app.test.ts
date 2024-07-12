import { Application } from 'express'
import createServer from '../utils/server'

jest.mock('dotenv', () => ({
  config: jest.fn(),
}))

describe('Server setup', () => {
  let app: Application
  let consoleSpy: jest.SpyInstance<
    void,
    [message?: any, ...optionalParams: any[]],
    any
  >

  beforeAll(async () => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    app = await createServer()
  })

  afterAll(() => {
    consoleSpy.mockRestore()
  })

  it('should create the server without errors', () => {
    expect(app).toBeDefined()
  })
})
