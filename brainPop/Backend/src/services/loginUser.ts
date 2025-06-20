import * as argon2 from "argon2";
import pgPromise from "pg-promise";

const pgp = pgPromise({});
const db = pgp(process.env.DATABASE_URL as string);

export async function loginUser(
    username: string,
    password: string
): Promise<{ success: boolean; message: string; userId?: number }> {
    // 1. Validierung der Eingaben
    if (!username || !password) {
        return { success: false, message: "Benutzername und Passwort sind erforderlich." };
    }

    try {
        interface DbUser {
            id: number;
            username: string;
            password: string;
        }

        const user = await db.oneOrNone<DbUser>(
            "SELECT id, username, password FROM users WHERE username = $1",
            [username]
        );

        // 3. Prüfen, ob der Benutzer existiert
        if (!user) {
            return { success: false, message: "Ungültiger Benutzername oder Passwort." };
        }

        // 4. Passwort überprüfen
        const passwordValid = await argon2.verify(user.password, password);
        
        if (!passwordValid) {
            return { success: false, message: "Ungültiger Benutzername oder Passwort." };
        }

        // 5. Erfolgreiche Anmeldung
        return { 
            success: true, 
            message: "Anmeldung erfolgreich!",
            userId: user.id
        };
    } catch (error) {
        console.error("Fehler bei der Anmeldung:", error);
        return { success: false, message: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut." };
    }
}