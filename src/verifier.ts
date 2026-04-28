import { agent } from './agent'
import { VerifiablePresentation } from '@veramo/core'

export class Verifier {
  
  // Verify a received Verifiable Presentation
  async verifyPresentation(vp: VerifiablePresentation, expectedChallenge: string): Promise<boolean> {
    console.log(`[Verifier] Verifying presentation...`)
    
    try {
      const result = await agent.verifyPresentation({
        presentation: vp,
        challenge: expectedChallenge,
      })

      if (result.verified) {
        console.log(`[Verifier] Cryptographic signatures verified successfully.`)
        // In a real system, you'd also check the challenge and expiration
        return true
      } else {
        console.log(`[Verifier] Verification failed: ${result.error?.message}`)
        return false
      }
    } catch (e) {
      console.error(`[Verifier] Error during verification:`, e)
      return false
    }
  }
}
