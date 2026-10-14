import { zipSync } from "fflate";
import { qrWithLogo } from "../Internal/qrWithLogo";
import { certDate, isRevoked, safeFileName, verifyLink } from "./certSchema";

export const certQr = (cert) => qrWithLogo(verifyLink(cert.code));

const dataUrlBytes = (url) => {
  const binary = atob(url.split(",")[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const save = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const downloadDataUrl = (url, filename) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
};

export const qrFileName = (cert) => `${safeFileName(cert.name || cert.nameAr)}_${cert.code}.png`;

/** Every QR code as one ZIP, each file named after the participant. */
export async function downloadQrZip(certs, zipName, onProgress) {
  const files = {};
  for (let i = 0; i < certs.length; i += 1) {
    const cert = certs[i];
    files[qrFileName(cert)] = [dataUrlBytes(await certQr(cert)), { level: 0 }]; // PNGs are already compressed
    onProgress?.((i + 1) / certs.length);
  }
  save(new Blob([zipSync(files)], { type: "application/zip" }), `${safeFileName(zipName)}.zip`);
}

const csvCell = (value) => {
  const s = String(value ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Name, program, date, code and verification link per row: ready for a mail
 * merge in Canva, Word or Google Slides. Excel opens it directly (UTF-8 BOM).
 */
export function downloadCsv(certs, fileName, headers) {
  const format = (v) => {
    const d = certDate(v);
    return d ? d.toISOString().slice(0, 10) : "";
  };
  const rows = [
    headers,
    ...certs.map((c) => [
      c.name,
      c.nameAr || "",
      c.program,
      c.programAr || "",
      format(c.eventDate),
      c.code,
      verifyLink(c.code),
      isRevoked(c) ? "revoked" : "valid",
    ]),
  ];
  const text = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  save(new Blob(["﻿", text], { type: "text/csv;charset=utf-8" }), `${safeFileName(fileName)}.csv`);
}
