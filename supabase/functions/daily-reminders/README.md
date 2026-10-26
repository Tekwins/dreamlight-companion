# Déploiement des notifications push

Étapes à faire une seule fois, depuis ton compte Supabase (je n'y ai pas accès). Ordre important.

## 1. Table et policies

Colle `supabase/schema.sql` en entier dans Supabase → SQL Editor → Run (il ne recrée que ce qui manque, sans toucher à `user_state`).

## 2. Secrets de la fonction

Dans un terminal, à la racine du projet, une fois [la CLI Supabase installée et connectée](https://supabase.com/docs/guides/cli) (`npx supabase login`, puis `npx supabase link --project-ref idmeekuelqbomisvnosn`) :

```bash
npx supabase secrets set VAPID_PUBLIC_KEY="<clé publique>"
npx supabase secrets set VAPID_PRIVATE_KEY="<clé privée>"
```

Les deux valeurs t'ont été transmises directement dans la conversation (jamais dans un fichier commité : la clé privée ne doit JAMAIS se retrouver dans le dépôt Git, même privé — c'est un secret serveur, au même titre que la clé `service_role`). La clé publique est aussi déjà dans le code client (`src/lib/push.js`) : normal, elle est publique par conception, comme la clé anon.

(`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement à la fonction par Supabase, rien à faire pour ceux-là.)

Si tu as perdu la clé privée, regénère une nouvelle paire (`VAPID_PUBLIC_KEY` doit alors aussi être mise à jour dans `src/lib/push.js`) :
```bash
node -e "const{generateKeyPairSync}=require('crypto');const b=b=>b.toString('base64url');const{publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});const spki=publicKey.export({type:'spki',format:'der'});const pkcs8=privateKey.export({type:'pkcs8',format:'der'});let priv;for(let i=0;i<pkcs8.length-34;i++)if(pkcs8[i]===4&&pkcs8[i+1]===32){priv=pkcs8.subarray(i+2,i+34);break}console.log('PUBLIC',b(spki.subarray(spki.length-65)));console.log('PRIVATE',b(priv))"
```

## 3. Déployer la fonction

```bash
npx supabase functions deploy daily-reminders --no-verify-jwt
```

`--no-verify-jwt` : la fonction est déclenchée par une tâche planifiée (pas par un utilisateur), elle s'authentifie elle-même auprès de la base avec la clé service_role lue dans ses variables d'environnement.

**Point à vérifier après le déploiement** : la fonction importe directement les données du jeu depuis `src/data/*.js` et `src/lib/*.js` (pas de copie à maintenir en double). Si le déploiement échoue sur ces imports relatifs, dis-le-moi : il faudra copier ces fichiers dans `supabase/functions/daily-reminders/_data/` à la place.

## 4. Planifier l'exécution (toutes les 15 minutes)

Dans Supabase → Database → Extensions, active `pg_cron` et `pg_net` si ce n'est pas déjà fait. Puis, dans SQL Editor :

```sql
select cron.schedule(
  'daily-reminders',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://idmeekuelqbomisvnosn.supabase.co/functions/v1/daily-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

## 5. Tester

1. Déploie l'appli (push + attendre le déploiement GitHub Pages, ou teste en local).
2. Connecte-toi à ton compte, va dans Réglages, active « Notifications sur cet appareil » (nécessite d'avoir accepté la permission du navigateur).
3. Dans Supabase → SQL Editor, vérifie qu'une ligne est apparue dans `push_subscriptions`.
4. Pour tester sans attendre ton heure de rappel : dans SQL Editor, appelle directement la fonction (Database → Functions, ou `select net.http_post(url := '.../functions/v1/daily-reminders', ...)`), ou change temporairement ton heure de rappel dans Réglages pour les 15 prochaines minutes.
5. Si rien n'arrive, regarde les logs de la fonction dans Supabase → Edge Functions → daily-reminders → Logs : ils disent combien d'envois ont réussi et pourquoi les échecs, le cas échéant.

## Limites connues de cette première version

- Un seul rappel groupé par jour (pas un par évènement).
- Fonctionne seulement pour les comptes connectés (la fonction a besoin de lire la progression synchronisée).
- Le créneau de 15 minutes suppose que la tâche planifiée tourne bien toutes les 15 minutes pile ; un décalage côté `pg_cron` peut retarder l'envoi jusqu'au prochain passage.
