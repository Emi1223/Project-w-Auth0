let auth0 = null;
let currentUser = null;

// Loading state management
function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'loading';
  loadingDiv.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Cargando...</p>
    </div>
  `;
  document.body.appendChild(loadingDiv);
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.remove();
  }
}

// Show notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

// Enhanced user profile display
function displayUserProfile(user) {
  currentUser = user;
  const welcomeText = document.getElementById("welcome-text");
  const avatar = document.querySelector('.avatar');
  
  // Update welcome text
  welcomeText.textContent = `¡Hola, ${user.name || user.email}!`;
  
  // Update avatar with user picture if available
  if (user.picture) {
    avatar.innerHTML = `<img src="${user.picture}" alt="Avatar" class="user-avatar-img">`;
  } else {
    avatar.innerHTML = `<i class="fas fa-user"></i>`;
  }
  
  // Add user info section
  const userInfo = document.createElement('div');
  userInfo.className = 'user-info';
  userInfo.innerHTML = `
    <div class="info-item">
      <i class="fas fa-envelope"></i>
      <span>${user.email}</span>
    </div>
    ${user.email_verified ? '<div class="verified-badge"><i class="fas fa-check-circle"></i> Email verificado</div>' : ''}
    <div class="info-item">
      <i class="fas fa-calendar"></i>
      <span>Último acceso: ${new Date().toLocaleDateString('es-ES')}</span>
    </div>
  `;
  
  const userProfile = document.querySelector('.user-profile');
  const existingInfo = userProfile.querySelector('.user-info');
  if (existingInfo) {
    existingInfo.remove();
  }
  userProfile.insertBefore(userInfo, document.querySelector('.user-actions'));
}

async function configureClient() {
  try {
    showLoading();
    auth0 = await createAuth0Client({
      domain: "dev-1en553m82oh6mqo6.us.auth0.com",
      client_id: "YXroNwv4LRkXlbDG2OxVcYVKACf3HWUM",
      redirectUri: window.location.origin,
      cacheLocation: 'localstorage',
      useRefreshTokens: true
    });
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error configuring Auth0:', error);
    showNotification('Error al configurar la autenticación', 'error');
  }
}

async function login() {
  try {
    showLoading();
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin,
      prompt: 'login'
    });
  } catch (error) {
    hideLoading();
    console.error('Error during login:', error);
    showNotification('Error al iniciar sesión', 'error');
  }
}

async function logout() {
  try {
    showLoading();
    await auth0.logout({
      returnTo: window.location.origin
    });
    showNotification('Sesión cerrada exitosamente', 'success');
  } catch (error) {
    hideLoading();
    console.error('Error during logout:', error);
    showNotification('Error al cerrar sesión', 'error');
  }
}

async function getAccessToken() {
  try {
    const token = await auth0.getTokenSilently();
    return token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

function updateUI(isAuthenticated, user = null) {
  const loginBtn = document.getElementById("btn-login");
  const logoutBtn = document.getElementById("btn-logout");
  const content = document.getElementById("content");
  
  if (isAuthenticated && user) {
    loginBtn.hidden = true;
    logoutBtn.hidden = false;
    content.hidden = false;
    displayUserProfile(user);
    showNotification(`¡Bienvenido de vuelta, ${user.name || user.email}!`, 'success');
  } else {
    loginBtn.hidden = false;
    logoutBtn.hidden = true;
    content.hidden = true;
  }
}

function setupUserActions() {
  const profileBtn = document.querySelector('.user-actions .btn:first-child');
  const settingsBtn = document.querySelector('.user-actions .btn:last-child');
  
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      showNotification('Función de perfil en desarrollo', 'info');
    });
  }
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      showNotification('Configuración en desarrollo', 'info');
    });
  }
}


window.onload = async () => {
  try {
    await configureClient();

    const query = window.location.search;
    if (query.includes("code=") && query.includes("state=")) {
      showLoading();
      try {
        await auth0.handleRedirectCallback();
        window.history.replaceState({}, document.title, "/");
        hideLoading();
      } catch (error) {
        hideLoading();
        console.error('Error handling callback:', error);
        showNotification('Error en el proceso de autenticación', 'error');
      }
    }

    const isAuthenticated = await auth0.isAuthenticated();
    let user = null;
    
    if (isAuthenticated) {
      user = await auth0.getUser();
    }
    
    updateUI(isAuthenticated, user);
    setupUserActions();

    document.getElementById("btn-login").addEventListener("click", login);
    document.getElementById("btn-logout").addEventListener("click", logout);
    
  } catch (error) {
    console.error('Error during initialization:', error);
    showNotification('Error al inicializar la aplicación', 'error');
  }
};

document.addEventListener('keydown', (event) => {
  if (event.altKey && event.key === 'l') {
    const loginBtn = document.getElementById("btn-login");
    if (!loginBtn.hidden) {
      login();
    }
  }
  
  if (event.altKey && event.key === 'o') {
    const logoutBtn = document.getElementById("btn-logout");
    if (!logoutBtn.hidden) {
      logout();
    }
  }
});
