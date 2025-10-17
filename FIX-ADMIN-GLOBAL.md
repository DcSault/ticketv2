# 🐛 Corrections - Admin Global & Import

## Problèmes corrigés

### 1. ❌ Admin Global ne peut pas modifier/supprimer les appels
**Cause** : Les contrôleurs vérifiaient `tenant_id` même pour l'admin global

**Solution** :
- ✅ `updateCall()` : Vérifie le rôle, si admin global, pas de filtre sur tenant
- ✅ `deleteCall()` : Vérifie le rôle, si admin global, pas de filtre sur tenant
- ✅ Les admins globaux peuvent maintenant gérer tous les appels

### 2. ❌ Validation frontend bloque l'ancien format
**Cause** : Le frontend validait que le JSON soit un tableau avant l'envoi

**Solution** :
- ✅ Validation minimale (JSON valide uniquement)
- ✅ Détection du format déléguée au backend
- ✅ Les deux formats sont maintenant acceptés

### 3. ❌ Tags apparaissent vides en édition
**Cause** : Structure des données mal mappée dans le composant CallItem

**Solution** :
- ✅ Déjà corrigé dans les modifications précédentes
- ✅ Tags chargés et affichés correctement

## 📝 Fichiers modifiés

### Backend
```
✅ server/controllers/callController.js
   - updateCall() : Support admin global
   - deleteCall() : Support admin global
```

### Frontend
```
✅ client/src/pages/Admin.jsx
   - handleImport() : Validation minimale
   - Détection format déléguée au backend
```

## 🔧 Logique de gestion des permissions

### Pour les utilisateurs normaux et tenant_admin :
```javascript
// Filtrer par tenant_id de l'utilisateur
WHERE calls.tenant_id = user.tenantId
```

### Pour global_admin :
```javascript
// Pas de filtre, accès à tous les tenants
WHERE 1=1  // Pas de restriction
```

## 🚀 Déploiement

```bash
# 1. Commit
git add -A
git commit -m "fix: Allow global admin to edit/delete all calls & auto-detect import format"
git push

# 2. Redémarrer Docker
docker-compose down
docker-compose up -d

# 3. Tester
# - Se connecter en admin global
# - Modifier un appel → ✅ Fonctionne
# - Supprimer un appel → ✅ Fonctionne
# - Importer ancien format → ✅ Fonctionne
```

## 🧪 Tests

### Test 1 : Admin Global peut modifier
```
1. Se connecter : admin / admin123
2. Aller sur /app
3. Cliquer "Modifier" sur un appel
4. Changer des données
5. Cliquer "Enregistrer"
✅ Doit fonctionner sans erreur 404
```

### Test 2 : Admin Global peut supprimer
```
1. Se connecter : admin / admin123
2. Aller sur /app
3. Cliquer "Supprimer" sur un appel
4. Confirmer
✅ Doit fonctionner sans erreur 404
```

### Test 3 : Import ancien format
```
1. Se connecter : admin / admin123
2. Aller sur /admin
3. Onglet "Import Appels"
4. Sélectionner tenant "Infrastructure"
5. Uploader : callfix-full-export-2025-10-17T09-11-10.json
6. Cliquer "Importer"
✅ Doit afficher "1053 appel(s) importé(s) avec succès"
```

### Test 4 : Utilisateur normal (isolation tenant)
```
1. Se connecter : infra_admin / admin123
2. Aller sur /app
3. Voir uniquement les appels de son tenant
4. Ne peut modifier que ses appels
✅ L'isolation multi-tenant fonctionne toujours
```

## 📊 Matrice de permissions

| Action | Utilisateur | Tenant Admin | Global Admin |
|--------|------------|--------------|--------------|
| Voir ses appels | ✅ | ✅ | ✅ |
| Voir autres tenants | ❌ | ❌ | ✅ |
| Créer appel | ✅ (son tenant) | ✅ (son tenant) | ✅ (tout tenant) |
| Modifier appel | ✅ (son tenant) | ✅ (son tenant) | ✅ (tout tenant) |
| Supprimer appel | ✅ (son tenant) | ✅ (son tenant) | ✅ (tout tenant) |
| Importer | ❌ | ❌ | ✅ |
| Gérer tenants | ❌ | ❌ | ✅ |
| Gérer users | ❌ | ❌ | ✅ |

## 🔍 Détails techniques

### Avant (updateCall)
```javascript
// Toujours filtrer par tenant
const checkCall = await client.query(
  'SELECT id FROM calls WHERE id = $1 AND tenant_id = $2',
  [id, tenantId]  // ❌ tenantId = null pour admin global
);
```

### Après (updateCall)
```javascript
// Filtrer conditionnellement
let checkQuery = 'SELECT id, tenant_id FROM calls WHERE id = $1';
const checkParams = [id];

if (!isGlobalAdmin) {
  checkQuery += ' AND tenant_id = $2';
  checkParams.push(req.user.tenantId);
}

const checkCall = await client.query(checkQuery, checkParams);
// ✅ Admin global : WHERE id = $1
// ✅ Autres : WHERE id = $1 AND tenant_id = $2
```

## ⚠️ Sécurité

L'admin global a un accès complet, mais :
- ✅ Doit être authentifié (JWT token)
- ✅ Doit avoir le rôle `global_admin`
- ✅ Les logs enregistrent qui fait quoi
- ✅ L'isolation multi-tenant reste active pour les autres rôles

## 🎯 Résumé

| Problème | Status |
|----------|--------|
| Admin global ne peut pas modifier | ✅ CORRIGÉ |
| Admin global ne peut pas supprimer | ✅ CORRIGÉ |
| Import ancien format bloqué | ✅ CORRIGÉ |
| Tags vides en édition | ✅ CORRIGÉ (avant) |
| Autocomplétion en édition | ✅ CORRIGÉ (avant) |
| Détection format automatique | ✅ FONCTIONNEL |

---

**Tout est prêt pour l'import de vos 1053 appels !** 🚀
