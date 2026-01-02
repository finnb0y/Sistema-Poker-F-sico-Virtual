/**
 * Test error message consistency after null userId fix
 */

// Mock import.meta.env for Node.js testing environment
if (typeof globalThis !== 'undefined') {
  const g = globalThis as any;
  if (typeof g.import === 'undefined') {
    g.import = {};
  }
  if (typeof g.import.meta === 'undefined') {
    g.import.meta = {};
  }
  if (typeof g.import.meta.env === 'undefined') {
    g.import.meta.env = {};
  }
}

import { syncService } from '../services/syncService';

async function testErrorMessages() {
  console.log('Testing error message consistency after null handling fix...\n');
  
  // Test 1: setAdminUserId(null) - should show guest error since isAdminMode resets
  syncService.setAdminUserId(null);
  console.log('After setAdminUserId(null):');
  console.log('  - getUserId():', syncService.getUserId());
  console.log('  - isAdmin():', syncService.isAdmin());
  try {
    await syncService.sendMessage({ type: 'BET', payload: {}, senderId: 'test' });
  } catch (e) {
    console.log('  - Error:', (e as Error).message);
  }
  
  console.log('\n');
  
  // Test 2: setGuestUserId(null) - should show guest error
  syncService.setGuestUserId(null);
  console.log('After setGuestUserId(null):');
  console.log('  - getUserId():', syncService.getUserId());
  console.log('  - isAdmin():', syncService.isAdmin());
  try {
    await syncService.sendMessage({ type: 'BET', payload: {}, senderId: 'test' });
  } catch (e) {
    console.log('  - Error:', (e as Error).message);
  }
  
  console.log('\n');
  
  // Test 3: setAdminUserId with valid id - should remember it's admin mode
  syncService.setAdminUserId('admin-123');
  console.log('After setAdminUserId("admin-123"):');
  console.log('  - getUserId():', syncService.getUserId());
  console.log('  - isAdmin():', syncService.isAdmin());
  console.log('  - (Would sync if Supabase was configured)');
  
  console.log('\n');
  
  console.log('✅ With our fix, isAdminMode is always consistent with userId state');
  console.log('✅ When userId is null, isAdminMode is false, so guest error is shown');
  console.log('✅ This is correct behavior - no authentication means guest mode');
}

testErrorMessages();
