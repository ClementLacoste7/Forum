// Load Quill from CDN (add in index.html: <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>)

let quillInstance = null

// Initialize Quill editor in a given container
export function initEditor(containerId) {
  quillInstance = new Quill(`#${containerId}`, {
    theme: "snow",
    modules: {
      toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ header: [1, 2, 3, false] }],
        ["link"],
        ["clean"],
      ],
    },
  })
  return quillInstance
}

// Get HTML content from editor
export function getEditorContent() {
  if (!quillInstance) return ""
  return quillInstance.root.innerHTML
}

// Set HTML content in editor
export function setEditorContent(html) {
  if (!quillInstance) return
  quillInstance.root.innerHTML = html
}
