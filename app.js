const button = document.querySelector('#run');
const status = document.querySelector('#status');
button.addEventListener('click', async () => {
  button.disabled = true; status.textContent = 'Connecting via MCP…';
  document.querySelector('#summary').textContent = 'Starting the local SDK client and server.';
  try {
    const response = await fetch(`/run?scenario=${encodeURIComponent(document.querySelector('#scenario').value)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    const result = data.result.structuredContent;
    status.textContent = data.result.isError ? 'Refused by input schema' : result.status ? `Claim: ${result.status}` : result.accounts ? 'Fictional accounts returned' : 'Fictional brief returned';
    document.querySelector('#summary').textContent = data.result.isError ? 'The account ID is outside the allowed fixture set. No account data was returned.' : result.explanation || result.notice;
    document.querySelector('#identity').textContent = `${data.server.name} v${data.server.version} • ${data.transport} • ${data.tools.length} tools discovered`;
    document.querySelector('#output').textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    status.textContent = 'Connection failed'; document.querySelector('#summary').textContent = error.message;
    document.querySelector('#identity').textContent = 'No successful result'; document.querySelector('#output').textContent = 'No result available.';
  } finally { button.disabled = false; }
});
