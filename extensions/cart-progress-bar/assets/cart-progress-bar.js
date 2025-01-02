document.addEventListener("DOMContentLoaded", () => {
    const cartDrawer = document.querySelector('cart-drawer-items');
    if (cartDrawer) {
      const progressBarContainer = document.createElement('div');
      progressBarContainer.id = 'cart-progress-bar';
      cartDrawer.appendChild(progressBarContainer);
  
      // Fetch data and render the progress bar
      fetch('/apps/your-app-endpoint')
        .then(response => response.json())
        .then(data => {
          progressBarContainer.innerHTML = data.progressBarHtml;
        });
    }
  });
  