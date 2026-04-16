/**
 * FASTA Batch Export Utility
 * =========================
 * Converts DNA fragments to proper FASTA format ready for submission
 * to synthesis labs like Twist Bioscience, IDT, or GenScript.
 *
 * FASTA format:
 *   >identifier description
 *   ATGCATGC...
 *
 * Each oligo gets a unique identifier with metadata (chunk, index, seed).
 * Line length wraps at 80 chars per FASTA convention.
 */

function wrapFasta(seq, width = 80) {
  const lines = [];
  for (let i = 0; i < seq.length; i += width) {
    lines.push(seq.slice(i, i + width));
  }
  return lines.join("\n");
}

function parseRaw(raw) {
  const pipeIdx = raw.indexOf("|");
  if (pipeIdx === -1) return null;
  const meta = raw.slice(0, pipeIdx);
  const dna = raw.slice(pipeIdx + 1);
  const parts = meta.split(":");
  return {
    chunkId: parts[0],
    index: parts[1],
    seed: parts[2] || "0",
    dna: dna,
    length: dna.length,
  };
}

/**
 * Generate FASTA content from raw fragment strings.
 * Returns a string ready to download as .fasta
 */
export function generateFasta(fragments, fileId, filename = "file") {
  const timestamp = new Date().toISOString();
  const lines = [
    `; DNA Vault FASTA Export`,
    `; File: ${filename}`,
    `; File ID: ${fileId}`,
    `; Generated: ${timestamp}`,
    `; Total oligos: ${fragments.length}`,
    `; Format: Ready for synthesis (Twist/IDT/GenScript compatible)`,
    `;`,
  ];

  fragments.forEach((raw, i) => {
    const p = parseRaw(raw);
    if (!p) return;
    // FASTA header with metadata
    const header = `>dna_vault_${fileId}_c${p.chunkId}_i${p.index}_s${p.seed} length=${p.length}`;
    lines.push(header);
    lines.push(wrapFasta(p.dna));
  });

  return lines.join("\n");
}

/**
 * Download FASTA file directly to the user's device.
 */
export function downloadFasta(fragments, fileId, filename = "file") {
  const content = generateFasta(fragments, fileId, filename);
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_oligos.fasta`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a lab submission CSV (alternative format some labs require).
 * Columns: Oligo Name, Sequence, Length, Scale, Purification
 */
export function downloadLabCSV(fragments, fileId, filename = "file") {
  const lines = [
    `Oligo Name,Sequence,Length,Scale,Purification`,
  ];

  fragments.forEach((raw, i) => {
    const p = parseRaw(raw);
    if (!p) return;
    const name = `dna_vault_${fileId}_c${p.chunkId}_i${p.index}`;
    lines.push(`${name},${p.dna},${p.length},25nmol,Standard`);
  });

  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_lab_submission.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
