// Simple toast notification utility
interface ToastElement extends HTMLElement {
  remove(): void;
}

const createToast = (
  message: string,
  type: "success" | "error" | "info"
): ToastElement => {
  const toast = document.createElement("div");
  const colors = {
    success: "bg-green-600 border-green-500",
    error: "bg-red-600 border-red-500",
    info: "bg-blue-600 border-blue-500",
  };

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
  };

  toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg border-l-4 z-50 max-w-md transform translate-x-0 opacity-100 transition-all duration-300 ease-in-out`;
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-lg">${icons[type]}</span>
      <span class="font-medium">${message}</span>
    </div>
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = "translateX(0)";
    toast.style.opacity = "1";
  }, 10);

  // Remove after delay
  setTimeout(
    () => {
      toast.style.transform = "translateX(100%)";
      toast.style.opacity = "0";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    },
    type === "success" ? 4000 : 5000
  );

  return toast as ToastElement;
};

export const toast = {
  success: (message: string) => {
    console.log("✅ Success:", message);
    return createToast(message, "success");
  },

  error: (message: string) => {
    console.error("❌ Error:", message);
    return createToast(message, "error");
  },

  info: (message: string) => {
    console.info("ℹ️ Info:", message);
    return createToast(message, "info");
  },
};
