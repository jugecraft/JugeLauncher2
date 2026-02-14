export type Language = 'en' | 'es';

export const translations = {
    en: {
        sidebar: {
            dashboard: "Dashboard",
            addons: "Addons",
            instances: "Instances",
            settings: "Settings",
            donate: "Donate"
        },
        settings: {
            title: "PREFERENCES",
            subtitle: "SYSTEM CONFIGURATION",
            memory: "Memory (RAM)",
            max_alloc: "Maximum Allocation (MB)",
            min_alloc: "Minimum Allocation (MB)",
            display: "Display",
            width: "Width",
            height: "Height",
            fullscreen: "Fullscreen",
            game_path: "Game Directory",
            java_path: "Java Runtime",
            language: "Language",
            save: "Save Changes",
            saving: "Saving...",
            select_folder: "Select Folder",
            select_file: "Select File"
        },
        dashboard: {
            play: "PLAY",
            installing: "INSTALLING",
            local_scan: "Local Scan",
            ready: "Ready to play",
            execute: "Execute Client",
            waiting: "Waiting for your command, Legend.",
            sync: "SYNC",
            launching: "Launching...",
            game_running: "Game Running",
            addons_title: "ADDONS & MODS",
            module_manager: "MODULE MANAGER",
            viewing_global: "VIEWING GLOBAL MODS FROM .MINECRAFT",
            instance_coming_soon: "Instance Manager Coming Soon",
            downloading: "Downloading {{file}} ({{percent}}%)",
            instance: "INSTANCE: {{name}}"
        },
        donation: {
            title: "Support JugeLauncher",
            message: "Thank you for being part of the JugeCraft community! Your support drives the development of JugeLauncher. Every contribution helps us maintain servers, develop new features, and keep the project alive.",
            motivation: "Every donation, no matter how small, motivates us to keep building the best experience for you.",
            paypal_btn: "Donate with PayPal",
            yape_btn: "Yape",
            footer: "Secure payments processed externally."
        },
        login: {
            initializing: "Initializing Secure Flow",
            visit: "Visit",
            submit_code: "Submit this unique access key",
            waiting: "Waiting for confirmation...",
            abort: "Abort Auth",
            offline_login: "Offline Login",
            username: "Username",
            login_btn: "Login",
            ms_login: "Microsoft Login",
            select_account: "Select Account Type",
            wait_confirm: "Waiting for confirmation...",
            welcome: "Welcome Back",
            type_login: "{{type}} Login"
        },
        profiles: {
            no_versions: "No versions installed",
            local: "Local"
        },
        mods: {
            search_placeholder: "Search mods...",
            jar_file: "JAR File",
            no_mods: "No mods found matching your search."
        },
        console: {
            title: "DEBUG CONSOLE",
            subtitle: "Live Output Stream",
            copy: "Copy to Clipboard",
            download: "Download Logs",
            clear: "Clear Console",
            idle: "System Idle - No logs captured",
            stream_active: "Stream Active",
            lines: "Lines",
            footer: "JugeLauncher // Runtime Env"
        },
        errors: {
            no_profile: "No profile selected",
            installing_for: "Installing version for {{name}}...",
            launch_error: "Launch Error: {{error}}",
            error_generic: "Error: {{error}}"
        }
    },
    es: {
        sidebar: {
            dashboard: "Panel",
            addons: "Mods",
            instances: "Instancias",
            settings: "Ajustes",
            donate: "Donar"
        },
        settings: {
            title: "PREFERENCIAS",
            subtitle: "CONFIGURACIÓN DEL SISTEMA",
            memory: "Memoria (RAM)",
            max_alloc: "Asignación Máxima (MB)",
            min_alloc: "Asignación Mínima (MB)",
            display: "Pantalla",
            width: "Ancho",
            height: "Alto",
            fullscreen: "Pantalla Completa",
            game_path: "Directorio del Juego",
            java_path: "Java Runtime",
            language: "Idioma",
            save: "Guardar Cambios",
            saving: "Guardando...",
            select_folder: "Seleccionar Carpeta",
            select_file: "Seleccionar Archivo"
        },
        dashboard: {
            play: "JUGAR",
            installing: "INSTALANDO",
            local_scan: "Escaneo Local",
            ready: "Listo para jugar",
            execute: "Ejecutar Cliente",
            waiting: "Esperando tu orden, Leyenda.",
            sync: "SINCRONIZAR",
            launching: "Iniciando...",
            game_running: "Juego en Ejecución",
            addons_title: "ADDONS Y MODS",
            module_manager: "GESTOR DE MÓDULOS",
            viewing_global: "VIENDO MODS GLOBALES DE .MINECRAFT",
            instance_coming_soon: "Gestor de Instancias Próximamente",
            downloading: "Descargando {{file}} ({{percent}}%)",
            instance: "INSTANCIA: {{name}}"
        },
        donation: {
            title: "Apoya a JugeLauncher",
            message: "¡Gracias por ser parte de la comunidad JugeCraft! Tu apoyo impulsa el desarrollo de JugeLauncher. Cada contribución nos ayuda a mantener servidores, desarrollar nuevas funciones y mantener vivo el proyecto.",
            motivation: "Cada donación, por pequeña que sea, nos motiva a seguir creando la mejor experiencia para ti.",
            paypal_btn: "Donar con PayPal",
            yape_btn: "Yape",
            footer: "Pagos seguros procesados externamente."
        },
        login: {
            initializing: "Iniciando Flujo Seguro",
            visit: "Visita",
            submit_code: "Ingresa este código único",
            waiting: "Esperando confirmación...",
            abort: "Cancelar Autenticación",
            offline_login: "Inicio de Sesión Offline",
            username: "Nombre de Usuario",
            login_btn: "Entrar",
            ms_login: "Iniciar sesión con Microsoft",
            select_account: "Seleccionar Tipo de Cuenta",
            welcome: "Bienvenido de Nuevo",
            type_login: "Sesión {{type}}"
        },
        profiles: {
            no_versions: "No hay versiones instaladas",
            local: "Local"
        },
        mods: {
            search_placeholder: "Buscar mods...",
            jar_file: "Archivo JAR",
            no_mods: "No se encontraron mods que coincidan con tu búsqueda."
        },
        console: {
            title: "CONSOLA DE DEPURACIÓN",
            subtitle: "Transmisión de Salida en Vivo",
            copy: "Copiar al Portapapeles",
            download: "Descargar Logs",
            clear: "Limpiar Consola",
            idle: "Sistema Inactivo - No hay logs capturados",
            stream_active: "Transmisión Activa",
            lines: "Líneas",
            footer: "JugeLauncher // Entorno de Ejecución"
        },
        errors: {
            no_profile: "Ningún perfil seleccionado",
            installing_for: "Instalando versión para {{name}}...",
            launch_error: "Error de Lanzamiento: {{error}}",
            error_generic: "Error: {{error}}"
        }
    }
};
