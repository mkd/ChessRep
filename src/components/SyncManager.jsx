import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '../lib/supabase';
import { loadRepertoire, saveRepertoire, onRepertoireChange } from '../utils/storage';

export default function SyncManager() {
    const { user } = useAuth();

    // 1. Auto-Save to Cloud on Local Change
    useEffect(() => {
        if (!user || !supabase) return;

        // Debounce timer
        let timeout;

        const handleChange = async (repertoire) => {
            if (!user) return; // Guard
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                console.log("[Sync] Detected change. User:", user.id);
                console.log("[Sync] Data size:", JSON.stringify(repertoire).length);

                try {
                    const { error } = await supabase
                        .from('repertoires')
                        .upsert({
                            user_id: user.id,
                            data: repertoire,
                            updated_at: new Date().toISOString()
                        });

                    if (error) {
                        console.error("[Sync] Upsert Error:", error);
                        throw error;
                    }
                    console.log("[Sync] Cloud sync complete.");
                } catch (e) {
                    console.error("[Sync] Failed:", e);
                }
            }, 2000); // 2 second debounce
        };

        const unsubscribe = onRepertoireChange(handleChange);
        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, [user]);

    // 2. Initial Pull on Login
    useEffect(() => {
        if (!user || !supabase) return;

        const fetchCloudData = async () => {
            try {
                const { data, error } = await supabase
                    .from('repertoires')
                    .select('data, updated_at')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"

                if (data) {
                    const local = loadRepertoire();
                    // Simple logic: If local is "empty" (default), overwrite with cloud.
                    // "Empty" means only root nodes with no children.
                    const isLocalEmpty = local.white.children.length === 0 && local.black.children.length === 0;

                    if (isLocalEmpty) {
                        console.log("Local empty, hydrating from cloud...");
                        saveRepertoire(data.data);
                        // Force reload page to apply changes? 
                        // Or dispatch event that components listen to?
                        // saveRepertoire dispatches event, but components might not update if they don't listen.
                        // For now, let's trigger a reload if we update from cloud on login.
                        window.location.reload();
                    } else {
                        console.log("Local data exists. Skipping auto-overwrite. (Conflict resolution TODO)");
                    }
                }
            } catch (e) {
                console.error("Failed to fetch cloud data:", e);
            }
        };

        fetchCloudData();
    }, [user]);

    return null; // Headless component
}
