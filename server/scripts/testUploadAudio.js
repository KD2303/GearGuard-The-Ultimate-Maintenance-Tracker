async function runTest() {
  console.log("🚀 Starting Programmatic Audio Upload Filter Test...");

  try {
    // 1. Construct a mock WebM audio file using Blobs
    const buffer = Buffer.from("RIFF....WAVEfmt ....data....mock-webm-audio-binary-payload");
    const blob = new Blob([buffer], { type: 'audio/webm' });
    
    // 2. Build multipart FormData
    const formData = new FormData();
    formData.append('attachments', blob, 'verification-voice.webm');

    console.log("📡 Sending POST request to http://localhost:5001/api/v1/upload/attachments...");
    
    // 3. Trigger native Node fetch request
    const response = await fetch('http://localhost:5001/api/v1/upload/attachments', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (response.status === 200) {
      console.log("\n✅ SUCCESS: File filter allowed the WebM audio upload!");
      console.log("📄 Response Data:", JSON.stringify(data, null, 2));
      
      const fileUrl = data[0]?.fileUrl;
      if (fileUrl && fileUrl.endsWith('.webm')) {
        console.log(`🎉 Verified uploaded file URL matches WebM format: ${fileUrl}`);
      } else {
        console.error("⚠️ Response returned but does not look like a WebM file URL.");
        process.exit(1);
      }
    } else {
      console.error(`\n❌ FAILED with status code ${response.status}`);
      console.error("📄 Error Response:", JSON.stringify(data, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Request crashed during execution:", error.message);
    process.exit(1);
  }
}

runTest();
