use warp::Filter;
use std::sync::{Arc, Mutex};
use crate::profiles::Profile;
use crate::mods::Mod;

// Shared state to hold current launch info
// In a real app, this would be updated when the game launches
#[derive(Clone)]
pub struct AppState {
    pub current_profile: Arc<Mutex<Option<Profile>>>,
    pub active_mods: Arc<Mutex<Vec<Mod>>>,
}

pub async fn start_server(state: AppState) {
    let state_filter = warp::any().map(move || state.clone());

    let info_route = warp::path("info")
        .map(|| warp::reply::json(&serde_json::json!({
            "name": "JugeLauncher",
            "version": "1.0.0",
            "status": "running"
        })));

    let profile_route = warp::path("profile")
        .and(state_filter.clone())
        .map(|state: AppState| {
            let profile = state.current_profile.lock().unwrap();
            warp::reply::json(&*profile)
        });

    let mods_route = warp::path("mods")
        .and(state_filter.clone())
        .map(|state: AppState| {
            let mods = state.active_mods.lock().unwrap();
            warp::reply::json(&*mods)
        });

    let routes = info_route.or(profile_route).or(mods_route);

    // Run on localhost:12345 (or dynamic)
    warp::serve(routes).run(([127, 0, 0, 1], 12345)).await;
}
