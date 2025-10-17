#!/usr/bin/env node

/**
 * Script de conversion d'export v2.0.7 vers format TicketV2
 * 
 * Usage: node convert-old-export.js <fichier-source.json> <fichier-destination.json>
 */

const fs = require('fs');
const path = require('path');

// Vérifier les arguments
if (process.argv.length < 4) {
  console.error('❌ Usage: node convert-old-export.js <source.json> <destination.json>');
  console.error('   Exemple: node convert-old-export.js callfix-full-export.json calls-import.json');
  process.exit(1);
}

const sourceFile = process.argv[2];
const destFile = process.argv[3];

// Vérifier que le fichier source existe
if (!fs.existsSync(sourceFile)) {
  console.error(`❌ Fichier source introuvable: ${sourceFile}`);
  process.exit(1);
}

console.log('📥 Lecture du fichier source...');
const rawData = fs.readFileSync(sourceFile, 'utf8');
const oldData = JSON.parse(rawData);

console.log('🔄 Conversion en cours...');
console.log(`   Version source: ${oldData.metadata?.version || 'inconnue'}`);
console.log(`   Tickets à convertir: ${oldData.metadata?.counts?.tickets || 0}`);

// Convertir les tickets en calls
const calls = [];
let converted = 0;
let skipped = 0;

if (oldData.data && oldData.data.tickets && Array.isArray(oldData.data.tickets)) {
  for (const ticket of oldData.data.tickets) {
    try {
      // Ne pas importer les tickets archivés (optionnel - commentez pour importer tout)
      if (ticket.isArchived) {
        skipped++;
        continue;
      }

      // Convertir au nouveau format
      const call = {
        caller: ticket.caller,
        reason: ticket.reason || '',
        tags: (ticket.tags || []).map(tag => ({ name: tag })),
        isBlocking: ticket.isBlocking || false,
        isGLPI: ticket.isGLPI || false,
        glpiNumber: ticket.glpiNumber || '',
        createdAt: ticket.createdAt
      };

      calls.push(call);
      converted++;
    } catch (error) {
      console.warn(`⚠️  Erreur lors de la conversion du ticket ${ticket.id}: ${error.message}`);
      skipped++;
    }
  }
} else {
  console.error('❌ Format de fichier invalide - structure "data.tickets" introuvable');
  process.exit(1);
}

console.log(`✅ Conversion terminée:`);
console.log(`   - ${converted} appels convertis`);
console.log(`   - ${skipped} tickets ignorés`);

// Sauvegarder le nouveau format
console.log(`💾 Enregistrement dans ${destFile}...`);
fs.writeFileSync(destFile, JSON.stringify(calls, null, 2), 'utf8');

console.log(`✅ Fichier créé avec succès !`);
console.log(`\n📋 Prochaines étapes:`);
console.log(`   1. Allez sur http://localhost:7979/admin`);
console.log(`   2. Cliquez sur l'onglet "📥 Import Appels"`);
console.log(`   3. Sélectionnez le tenant de destination`);
console.log(`   4. Uploadez le fichier: ${destFile}`);
console.log(`   5. Cliquez sur "Importer les appels"`);
console.log('');
