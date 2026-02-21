# 🩸 BadBlood 

> *"‘Cause, baby, now we got bad blood. You know it used to be mad love."* — Taylor Swift

**The future of patient-centric health intelligence.**

The current standard of patient lab reporting is broken. When patients receive a pathology report, they are handed a sterile, 14-page PDF filled with chemical jargon—"Alanine Aminotransferase," "Eosinophils," "Creatinine." It is terrifying, confusing, and ultimately useless to the average person. 

Patients don't want raw data. They want to know: *How is my Liver? How is my Heart? Am I okay?*

## 🕷️ The Vision: Why BadBlood?

BadBlood is not just a translation layer; it is the new interface for human biology. We take the antiquated, hard-to-read wall of data and transform it into a living, intuitive map of a patient's biological state. We bridge the gap between clinical diagnostics and patient comprehension, turning anxiety into actionable intelligence.

### 🤖 Native AI Integration (MCP)
BadBlood is built from the ground up as a **Model Context Protocol (MCP)** server. This means there is no clunky app to download or new portal to log into. Patients can access BadBlood's intelligence directly through the AI assistants they already use and trust every day, like **ChatGPT** or **Claude**.

### 🔒 Zero-Trust Privacy
Health data is sacred. Because BadBlood operates via the MCP architecture, the patient's data processing happens entirely within their chosen, secure AI session. Raw pathology reports and symptom data are never stored or sold by a third-party database. It is pure, private intelligence.

### Phase 1: Data Ingestion & Instant Visualization

The friction is zero. The patient uploads a standard lab report PDF (Quest Diagnostics, LabCorp, etc.) directly into the interface.

*(Insert GIF/Image here: A clean UI showing a messy standard lab PDF being dropped into a minimal chat window, instantly transforming into a beautiful Radar Chart)*
<p align="center">
  <img src="https://via.placeholder.com/800x400?text=Animated+GIF:+PDF+Drop+to+Spider+Chart+Transformation" alt="BadBlood Visualization Demo" width="100%">
</p>

Behind the scenes, the BadBlood engine utilizes specialized extraction tools to instantly parse the unstructured data. We categorize dozens of chaotic biomarkers into five core physiological systems:
- ❤️ **Cardiovascular Health:** LDL, HDL, Triglycerides
- 🩸 **Hepatic Function (Liver):** AST, ALT, Bilirubin
- 🚰 **Renal Function (Kidneys):** BUN, Creatinine
- 🛡️ **Immune System:** WBC, Eosinophils, Monocytes
- 🔋 **Metabolic State:** Glucose, Iron, Vitamin D, TSH

The output is immediate. We generate a dynamic "Spider Chart"—a visual health map. The center is optimal health (0); the outer edges indicate systemic risk (10). Without a medical degree, a patient instantly sees if their "Heart" or "Energy" quadrant is spiking out of range. 

### Phase 2: Contextual Intelligence

BadBlood doesn't stop at visualization. It acts as an intelligent health advocate, asking hyper-targeted questions based on the anomalies detected.

*Example scenario: "Your liver and lipid panels are flagging outside optimal zones. Are you experiencing any physical symptoms right now, like chronic fatigue, joint pain, or brain fog?"*

### Phase 3: Actionable Patient Empowerment

When the patient provides context (*"Yes, I'm exhausted every afternoon and have stomach issues"*), the engine cross-references the raw clinical data with the reported symptoms.

BadBlood generates a **Doctor's Briefing**—a concise, formatted summary correlating their physical symptoms to their out-of-range clinical data. It provides the patient with the specific, necessary questions they must ask their physician at their next visit. 

*(Insert Screenshot here: The 'Doctor's Briefing' output showing exactly what the patient needs to ask)*
<p align="center">
  <img src="https://via.placeholder.com/800x400?text=Screenshot:+Actionable+Doctor's+Briefing" alt="BadBlood Doctor's Briefing" width="80%">
</p>

We are moving patients from passive confusion to proactive health management. 

---

## 🛠️ The Technology (Under the Hood)

BadBlood is built on a scalable, modular architecture powered by the Model Context Protocol (MCP) and LLMs.

1. **Extraction Engine:** Seamlessly ingests and structures complex, unstructured PDF data.
2. **Translation Layer:** Normalizes values across disparate metrics (mg/dL vs U/L) to calculate a unified "Risk Score" (0-10) for each physiological system.
3. **Dynamic Visualization:** Outputs strict JSON payloads to instantly render intuitive Radar/Spider Charts on the frontend, avoiding complex legacy UI development in favor of pure data-driven visualization.

```json
{
  "chartConfig": {
    "type": "radar",
    "title": "BadBlood: Systemic Risk Map"
  },
  "data": [
    { "system": "Heart (Cardio)", "riskScore": 8 },
    { "system": "Liver (Hepatic)", "riskScore": 2 },
    { "system": "Kidneys (Renal)", "riskScore": 1 },
    { "system": "Immunity (WBC)", "riskScore": 3 },
    { "system": "Energy (Metabolism)", "riskScore": 7 }
  ]
}
```

---

## 💻 Technical Documentation

For technical implementation details, local execution, and MCP integration guidelines, please review our [Developer Guide](dev.md).
