import { createAgent, IResolver, IDIDManager, IKeyManager, ICredentialPlugin } from '@veramo/core'
import { DIDManager } from '@veramo/did-manager'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import { KeyDIDProvider } from '@veramo/did-provider-key'
import { KeyManager } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { Resolver } from 'did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { getResolver as keyDidResolver } from 'key-did-resolver'
import { MemoryDIDStore } from '@veramo/did-manager'
import { MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'

// For a persistent store in production, use TypeORM (e.g., @veramo/data-store)
const memoryDIDStore = new MemoryDIDStore()
const memoryKeyStore = new MemoryKeyStore()
const memoryPrivateKeyStore = new MemoryPrivateKeyStore()

const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID || 'your_infura_project_id' // Loaded from .env

export const agent = createAgent<IResolver & IDIDManager & IKeyManager & ICredentialPlugin>({
  plugins: [
    new KeyManager({
      store: memoryKeyStore,
      kms: {
        local: new KeyManagementSystem(memoryPrivateKeyStore),
      },
    }),
    new DIDManager({
      store: memoryDIDStore,
      defaultProvider: 'did:key',
      providers: {
        'did:ethr': new EthrDIDProvider({
          defaultKms: 'local',
          network: 'goerli',
          rpcUrl: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
        }),
        'did:key': new KeyDIDProvider({
          defaultKms: 'local',
        }),
      },
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...ethrDidResolver({ infuraProjectId: INFURA_PROJECT_ID }),
        ...keyDidResolver(),
      }),
    }),
    new CredentialPlugin(),
  ],
})
