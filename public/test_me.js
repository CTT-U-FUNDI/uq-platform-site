// Test automatique du token navigateur
(async function testToken() {
    const token = localStorage.getItem('uq_token');
    const number = localStorage.getItem('uq_number');
    
    const result = document.createElement('pre');
    result.id = 'test-result';
    result.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#0A0A0F;color:#EAECEF;padding:20px;font-family:monospace;z-index:99999;overflow:auto;';
    
    if (!token) {
        result.textContent = '❌ TOKEN: VIDE\n❌ Tu n\'es PAS connecté';
        document.body.appendChild(result);
        return;
    }
    
    let decoded = {};
    try {
        decoded = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch(e) {}
    
    const now = Math.floor(Date.now() / 1000);
    const expired = decoded.exp && decoded.exp < now;
    
    result.textContent = `
TEST TOKEN NAVIGATEUR
═══════════════════════════════════════════════════════════

TOKEN : ${token.substring(0, 50)}...
NUMBER: ${number || 'VIDE'}

DÉCODÉ :
   sub  : ${decoded.sub || 'N/A'}
   role : ${decoded.role || 'N/A'}
   exp  : ${decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'N/A'}
   iat  : ${decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'N/A'}

Maintenant : ${new Date(now * 1000).toISOString()}
Expiré : ${expired ? '❌ OUI' : '✅ NON'}

═══════════════════════════════════════════════════════════
TEST /api/account/me EN COURS...
`;

    document.body.appendChild(result);
    
    try {
        const r = await fetch('http://localhost:5000/api/account/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        const data = await r.json();
        
        result.textContent += `
STATUS : ${r.status}
RÉPONSE: ${JSON.stringify(data, null, 2)}
`;
    } catch(e) {
        result.textContent += `
ERREUR : ${e.message}
`;
    }
})();
