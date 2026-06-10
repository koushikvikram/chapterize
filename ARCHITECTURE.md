# **Architecture & Technical Design**

**Chapterize** utilizes a **Hybrid Client-Side Architecture**. It offloads heavy data processing to the user's browser to ensure privacy and low latency, while leveraging Cloud AI solely for intelligence and decision-making.

## **🏗 High-Level Overview**

graph TD  
    User\[User / Browser\] \--\>|Uploads PDF| Mem\[Browser Memory (ArrayBuffer)\]  
    Mem \--\>|Read Text| PDFJS\[PDF.js\]  
    PDFJS \--\>|Extract First 300 chars| Snippets\[Page Metadata\]  
    Snippets \--\>|Send Metadata| Gemini\[Google Gemini API\]  
    Gemini \--\>|Return JSON Structure| Logic\[React App Logic\]  
    Logic \--\>|Read Original Buffer| PDFLib\[pdf-lib\]  
    PDFLib \--\>|Slice & Package| Zip\[JSZip\]  
    Zip \--\>|Download| User

## **🔒 The Privacy-First Hybrid Model**

Unlike traditional PDF tools that upload the entire document to a server for processing, this application operates on a **"Zero-Upload"** principle for the binary file itself.

1. **Local Binary Processing:** The full PDF binary (.pdf file) **never leaves the user's browser**. All splitting, slicing, and zipping operations occur within the client's memory using WebAssembly/JavaScript libraries (pdf-lib, jszip).  
2. **Cloud Intelligence:** Only **text snippets** (metadata) are sent to the cloud. We extract the first 300 characters of each page—just enough to capture headers like "Chapter 1" or "Introduction"—and send this lightweight text payload to Google Gemini.

**Benefit:** This architecture ensures that sensitive book content (images, full body text) remains private, while still benefiting from LLM-powered structure detection.

## **⚙️ The Pipeline**

### **1\. Text Extraction (pdf.js)**

We use pdf.js to render the PDF in the background. Instead of rendering visuals, we use the getTextContent() method.

* **Optimization:** We do not read the entire page. We limit the extraction to the first \~300 characters. This reduces the token count sent to the LLM and speeds up the "Scanning" phase significantly.

### **2\. Structure Detection (Gemini 3 Flash Preview)**

We treat the chapter detection problem as a **Structured Output** task.

* **Input:** A JSON array of page summaries: \[{ page: 1, text: "..." }, { page: 2, text: "..." }\].  
* **Prompt Strategy:** We explicitly ask for a JSON object containing startPage integers. We instruct the model to look for specific cues (Roman numerals, "Chapter", capitalized titles) but rely on its semantic understanding to distinguish between a Table of Contents entry (which mentions a chapter) and the actual Chapter Header itself.  
* **Model:** `gemini-3-flash-preview` is used for structured chapter detection with low latency.

### **3\. Binary Splitting (pdf-lib)**

Once Gemini returns the startPage indices, we return to the binary data.

* **Logic:** We calculate page ranges (e.g., Chapter 1 is Page 5 to 11).  
* **Operation:** pdf-lib copies these specific pages from the source document into a new PDFDocument instance and serializes it to bytes.

## **🧠 Memory Management & Performance**

### **The "Detached Buffer" Challenge**

A critical implementation detail in this architecture is handling ArrayBuffer states.

* **The Problem:** When pdf.js parses a PDF, it often transfers ownership of the ArrayBuffer to a Web Worker thread to prevent UI freezing. This "detaches" the buffer from the main thread, making it unusable for subsequent operations.  
* **The Solution:** We implement a **Double-Fetch Strategy**.  
  1. We read file.arrayBuffer() once for pdf.js analysis.  
  2. Immediately before the splitting phase (after Gemini returns), we invoke file.arrayBuffer() *again* to get a fresh, valid memory reference for pdf-lib.

### **Browser Limits**

Since this is a client-side app:

* **Memory Cap:** Browsers typically limit the memory a single tab can use (often 2GB-4GB). Extremely large PDFs (e.g., high-res scanned textbooks \> 500MB) may crash the tab during the Zipping phase.  
* **Mitigation:** We process files sequentially where possible and encourage the use of textual PDFs over image-heavy ones.

## **📚 Libraries**

| Library | Role | Why? |
| :---- | :---- | :---- |
| **React** | UI Framework | Component-based state management. |
| **@google/generative-ai** | AI Client | Official SDK for Gemini interactions. |
| **pdf.js** | Text Reader | Mozilla's standard for accurate PDF text extraction. |
| **pdf-lib** | PDF Editor | Allows modification/creation of PDFs in pure JS. |
| **JSZip** | Compression | Bundles multiple Blobs into a single downloadable file. |

