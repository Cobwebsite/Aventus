import { spawn } from 'child_process';
import { readFileSync } from 'fs'


export function executeDbQuery(payload) {
    return new Promise((resolve, reject) => {
        // Remplace par le chemin vers ton binaire .NET compilé
        const child = spawn('dotnet', ['D:/Aventus/AvenutsSharp/DatabaseQuery/bin/Debug/net10.0/DatabaseQuery.dll']);

        let responseData = '';
        let errorData = '';

        // On écrit le payload JSON dans le stdin du process C#
        child.stdin.write(JSON.stringify(payload));
        child.stdin.end();

        // On écoute la réponse sur stdout
        child.stdout.on('data', (data) => {
            responseData += data.toString();
        });

        // On écoute les erreurs système potentielles (ex: crash du binaire)
        child.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Le processus .NET a quitté avec le code ${code}: ${errorData}`));
                return;
            }

            try {
                const result = JSON.parse(responseData);
                if (result.Success) {
                    resolve(result.Result);
                } else {
                    reject(new Error(result.Errors));
                }
            } catch (e) {
                reject(new Error("Impossible de parser la réponse JSON du binaire .NET"));
            }
        });
    });
}


const payload = {
    Type: "mysql",
    Host: "localhost",
    Username: "root",
    Password: "",
    Database: "Spalio2",
    Query: readFileSync("queryMariaDB.sql", 'utf-8')
}

executeDbQuery(payload).then((result) => {
    console.log(JSON.parse(result[0].metadata_json_to_import));
})