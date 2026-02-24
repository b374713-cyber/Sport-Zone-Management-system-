// Front_end/snp/src/components/gym/IdCardModal.jsx
import React, { useMemo, useRef, useState } from "react";
import { Modal, Button, ButtonGroup } from "react-bootstrap";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import gymSymbol from "../../assets/gym_symbol.jpg";

// ✅ uses SAME base as service (so IP change affects QR + photos)
import idCardsService from "../../services/idCardsService";

/**
 * ============================================================
 * 🔥 WHEN YOU CHANGE WIFI, EDIT THE IP HERE:
 * Go to: src/services/idCardsService.js
 * and change:
 *   const BASE = "http://YOUR_NEW_IP:5000/api/idcards";
 * Example:
 *   const BASE = "http://172.20.10.9:5000/api/idcards";
 * ============================================================
 */

export default function IdCardModal({ show, onHide, card }) {
  // ✅ hooks FIRST (no conditional hooks)
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [side, setSide] = useState("front");

  // ✅ token extraction (works for member/coach)
  const token = useMemo(() => {
    return (
      card?.qr_token ||
      card?.qrToken ||
      card?.token ||
      card?.qr_code_token ||
      card?.qr_code ||
      card?.qr ||
      ""
    );
  }, [card]);

  // ✅ public url uses service BASE (IP/LAN)
  const publicUrl = useMemo(() => {
    if (!token) return "";
    return idCardsService.publicUrl(token);
  }, [token]);

  // ✅ derive API host from the same BASE once
  // idCardsService.publicUrl("X") => http://IP:5000/api/idcards/public/X
  const API_HOST = useMemo(() => {
    const test = idCardsService.publicUrl("X");
    return test.replace(/\/api\/idcards\/public\/X$/, "");
  }, []);

  // ✅ build absolute photo using SAME host as BASE
  const photoSrc = useMemo(() => {
    const rawPhoto =
      card?.photo_url ||
      card?.photo ||
      card?.image_url ||
      card?.member_photo_url ||
      card?.coach_photo_url;

    if (!rawPhoto || String(rawPhoto).trim() === "") return null;

    const v = String(rawPhoto);
    if (v.startsWith("http") || v.startsWith("data:")) return v;

    // use API_HOST from service base
    return `${API_HOST}/${v.replace(/^\/+/, "")}`;
  }, [card, API_HOST]);

  if (!card) return null;

  // credit-card ratio
  const CARD_W = 360;
  const CARD_H = Math.round(CARD_W / 1.586);

  const color = card.color || "#146b57";

  // dynamic label
  const roleLabel = card.role === "coach" ? "GYM COACH" : "GYM MEMBER";

  async function captureNode(ref) {
    const node = ref.current;
    if (!node) return null;

    const canvas = await html2canvas(node, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
    });

    return canvas;
  }

  async function handleDownloadImage() {
    const prevSide = side;

    setSide("front");
    await new Promise((r) => setTimeout(r, 140));
    const frontCanvas = await captureNode(frontRef);

    setSide("back");
    await new Promise((r) => setTimeout(r, 140));
    const backCanvas = await captureNode(backRef);

    setSide(prevSide);

    if (!frontCanvas || !backCanvas) return;

    const combined = document.createElement("canvas");
    combined.width = frontCanvas.width;
    combined.height = frontCanvas.height + backCanvas.height;

    const ctx = combined.getContext("2d");
    ctx.drawImage(frontCanvas, 0, 0);
    ctx.drawImage(backCanvas, 0, frontCanvas.height);

    const url = combined.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.full_name || "id-card"}-both.png`;
    a.click();
  }

  async function handleDownloadPdf() {
    const prevSide = side;

    setSide("front");
    await new Promise((r) => setTimeout(r, 140));
    const frontCanvas = await captureNode(frontRef);

    setSide("back");
    await new Promise((r) => setTimeout(r, 140));
    const backCanvas = await captureNode(backRef);

    setSide(prevSide);

    if (!frontCanvas || !backCanvas) return;

    const frontImg = frontCanvas.toDataURL("image/png");
    const backImg = backCanvas.toDataURL("image/png");

    const mmW = 85.6;
    const mmH = 53.98;

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [mmW, mmH],
    });

    pdf.addImage(frontImg, "PNG", 0, 0, mmW, mmH);
    pdf.addPage([mmW, mmH], "landscape");
    pdf.addImage(backImg, "PNG", 0, 0, mmW, mmH);

    pdf.save(`${card.full_name || "id-card"}.pdf`);
  }

  function handlePrint() {
    const node = side === "front" ? frontRef.current : backRef.current;
    if (!node) return;

    const w = window.open("", "_blank", "width=900,height=700");
    w.document.write(`
      <html>
        <head>
          <title>ID Card</title>
          <style>
            body { margin:0; display:flex; justify-content:center; align-items:center; height:100vh; }
          </style>
        </head>
        <body>
          ${node.outerHTML}
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>ID Card Preview</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Tabs */}
        <div className="d-flex justify-content-center mb-3">
          <ButtonGroup>
            <Button
              variant={side === "front" ? "primary" : "outline-primary"}
              onClick={() => setSide("front")}
            >
              Front
            </Button>
            <Button
              variant={side === "back" ? "primary" : "outline-primary"}
              onClick={() => setSide("back")}
            >
              Back (QR)
            </Button>
          </ButtonGroup>
        </div>

        <div className="d-flex justify-content-center position-relative">
          {/* FRONT */}
          {side === "front" && (
            <div
              ref={frontRef}
              style={{
                width: CARD_W,
                height: CARD_H,
                borderRadius: 12,
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, #ffffff 0%, #f7f9fc 55%, #eef2ff 100%)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.14)",
                border: "1px solid #e9ecef",
                position: "relative",
              }}
            >
              {/* header */}
              <div
                style={{
                  height: 54,
                  background: `linear-gradient(90deg, ${color} 0%, #3b2a88 100%)`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  fontWeight: 800,
                  letterSpacing: 0.7,
                  fontSize: 15,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    overflow: "hidden",
                    marginRight: 10,
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={gymSymbol}
                    alt="gym"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>

                SPORT ZONE ID

                <div style={{ marginLeft: "auto" }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.18)",
                    }}
                  >
                    {roleLabel}
                  </div>
                </div>
              </div>

              {/* body */}
              <div style={{ display: "flex", height: CARD_H - 54 }}>
                {/* photo */}
                <div
                  style={{
                    width: "30%",
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.00))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRight: "1px dashed #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "#ddd",
                      border: `3px solid ${color}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 30,
                    }}
                  >
                    {photoSrc ? (
                      <img
                        src={photoSrc}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      "👤"
                    )}
                  </div>
                </div>

                {/* details */}
                <div style={{ flex: 1, padding: "14px 16px", position: "relative" }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                    SUB ID
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>
                    {card.sub_id}
                  </div>

                  <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>
                    {card.full_name}
                  </div>

                  {card.dob && (
                    <div style={{ fontSize: 13, marginBottom: 6 }}>
                      <b>DOB:</b> {String(card.dob).slice(0, 10)}
                    </div>
                  )}

                  {card.height_cm != null && (
                    <div style={{ fontSize: 13 }}>
                      <b>Height:</b> {card.height_cm} cm
                    </div>
                  )}

                  <div
                    style={{
                      position: "absolute",
                      right: 12,
                      bottom: 10,
                      fontSize: 10,
                      color: "#6b7280",
                    }}
                  >
                    Scan QR on back to verify
                  </div>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 6,
                  background: `linear-gradient(90deg, ${color}, #3b2a88)`,
                }}
              />
            </div>
          )}

          {/* BACK */}
          {side === "back" && (
            <div
              ref={backRef}
              style={{
                width: CARD_W,
                height: CARD_H,
                borderRadius: 12,
                overflow: "hidden",
                color: "#fff",
                background:
                  "linear-gradient(145deg, #0b1223 0%, #101b3d 60%, #0f172a 100%)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.14)",
                border: "1px solid #0b1220",
              }}
            >
              <div style={{ height: 38, background: "#000" }} />

              <div
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  height: CARD_H - 38,
                  gap: 12,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    wordBreak: "break-all",
                    overflowWrap: "anywhere",
                    fontSize: 11.5,
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 6 }}>
                    SPORT ZONE
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    This card is property of Sport Zone.
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 10 }}>
                    If found, please return to reception.
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6 }}>
                    URL: {publicUrl}
                  </div>
                </div>

                <div
                  style={{
                    flexShrink: 0,
                    width: 122,
                    height: 122,
                    background: "#fff",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 6,
                  }}
                >
                  {publicUrl ? (
                    <QRCodeCanvas value={publicUrl} size={98} includeMargin />
                  ) : (
                    <div style={{ color: "#111", fontSize: 12 }}>No QR</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {publicUrl && (
          <div className="text-center mt-3">
            <a href={publicUrl} target="_blank" rel="noreferrer">
              Open public page
            </a>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>

        <div className="d-flex gap-2">
          <Button variant="success" onClick={handleDownloadImage}>
            Download Image (Both)
          </Button>
          <Button variant="danger" onClick={handleDownloadPdf}>
            Download PDF
          </Button>
          <Button onClick={handlePrint}>Print</Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
