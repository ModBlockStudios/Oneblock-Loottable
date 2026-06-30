/* Petit bandeau de confirmation (copie d'identifiant). */
export default function Toast({ message, show }) {
  return <div className={'toast' + (show ? ' toast--show' : '')}>{message}</div>;
}
