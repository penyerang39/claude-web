// ==UserScript==
// @name         Claude AI in Google Search
// @namespace    http://tampermonkey.net/
// @version      0.2.0
// @description  Adds Claude AI responses alongside Google search results
// @author       Your Name
// @match        https://google.com/*
// @match        https://www.google.com/*
// @icon         https://www.anthropic.com/favicon.ico
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://raw.githubusercontent.com/sizzlemctwizzle/GM_config/master/gm_config.js
// @require      https://gist.githubusercontent.com/scambier/109932d45b7592d3decf24194008be4d/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_addStyle
// @connect      api.anthropic.com
// ==/UserScript==

(function() {
    'use strict';

    // Constants
    const SIDEBAR_SELECTOR = "#rhs";
    const RESULTS_DIV_ID = "ClaudeResults";
    const LOADING_SPAN_ID = "ClaudeLoading";
    const MAX_HISTORY_ITEMS = 5;
    const HISTORY_KEY = 'claude_query_history';

    // Google-matching styles
    const STYLES = `
        #${RESULTS_DIV_ID} {
            font-family: arial,sans-serif;
            margin-bottom: 30px;
            background: var(--rhs-background, #fff);
            border: 1px solid var(--border-color, #dfe1e5);
            border-radius: 8px;
        }
        @media (prefers-color-scheme: dark) {
            #${RESULTS_DIV_ID} {
                background: var(--rhs-background, #202124);
                border-color: var(--border-color, #3c4043);
                color: var(--text-color, #bdc1c6);
            }
        }
        .claude-container {
            padding: 6px 16px 16px; // should match google's design
        }
        .claude-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
            font-family: Google Sans,arial,sans-serif;
            font-size: 14px;
        }
        .claude-title {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-color, #ffffff);
        }
        .claude-settings {
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            color: var(--secondary-text, #70757a);
        }
        .claude-settings:hover {
            background: var(--hover-bg, #f1f3f4);
        }
        .claude-response {
            font-size: 14px;
            line-height: 1.58;
            color: var(--text-color, #ffffff);
            white-space: pre-wrap;
        }
        .claude-loading {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--secondary-text, #70757a);
            font-size: 14px;
        }
        .loading-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid var(--secondary-text, #70757a);
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        .claude-error {
            color: #d93025;
            background: var(--error-bg, #fce8e6);
            padding: 12px;
            border-radius: 8px;
            margin-top: 8px;
            font-size: 14px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    // Configuration setup
    const gmc = new GM_config({
        id: 'ClaudeGoogleConfig',
        title: 'Claude AI Settings',
        fields: {
            model:{
                label: 'Anthropic Model',
                type: 'select',
                options: [
                    'claude-3-5-sonnet-20241022',
                    'claude-3-5-haiku-20241022',
                    'claude-3-haiku-20240307',
                ],
                default:  'claude-3-5-sonnet-20241022'
            },
            apiKey: {
                label: 'Anthropic API Key',
                type: 'text',
                default: ''
            },
            maxTokens: {
                label: 'Max Response Tokens',
                type: 'int',
                default: 1024
            }
        }
    });

    function getQueryHistory() {
        return GM_getValue(HISTORY_KEY, []);
    }

    function updateQueryHistory(query, response) {
        let history = getQueryHistory();
        history.unshift({ query, response, timestamp: Date.now() });
        history = history.slice(0, MAX_HISTORY_ITEMS);
        GM_setValue(HISTORY_KEY, history);
    }

    async function getClaudeResponse(query) {
        const apiKey = gmc.get("apiKey");
        if (!apiKey) {
            throw new Error("API key not configured");
        }

        const history = getQueryHistory();
        const contextPrompt = history.length > 0
            ? "\n\nFor context, here are the user's previous queries and your responses:\n" +
              history.map(h => `Query: "${h.query}"\nYour response: ${h.response}`).join('\n\n')
            : '';

        return new Promise((resolve, reject) => {
            GM.xmlHttpRequest({
                method: "POST",
                url: "https://api.anthropic.com/v1/messages",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01"
                },
                data: JSON.stringify({
                    model: gmc.get("model"),
                    max_tokens: gmc.get("maxTokens"),
                    messages: [{
                        role: "user",
                        content: [{
                            type: "text",
                            text: `You are a senior expert. Provide a concise, helpful response to this search query: "${query}".
                            Focus on giving factual, relevant information without any preamble.${contextPrompt}`
                        }]
                    }]
                }),
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.error) {
                            reject(new Error(data.error.message));
                        } else {
                            const responseText = data.content[0].text;
                            updateQueryHistory(query, responseText);
                            resolve(responseText);
                        }
                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: function(error) {
                    reject(new Error('Failed to connect to Claude API'));
                }
            });
        });
    }

    function setupUI() {
        injectStyles();
        injectResultsContainer();
        injectHeader();
    }

    function injectStyles() {
        GM_addStyle(STYLES);
    }

    function injectResultsContainer() {
        if (!$(SIDEBAR_SELECTOR)[0]) {
            $("#rcnt").append('<div id="rhs"></div>');
        }
        if (!$(`#${RESULTS_DIV_ID}`)[0]) {
            const resultsDiv = $(`<div id="${RESULTS_DIV_ID}"><div class="claude-container"></div></div>`);
            $(SIDEBAR_SELECTOR).prepend(resultsDiv);
        }
    }

    function injectHeader() {
        const settingsId = "ClaudeSettings";
        if (!$(`#${settingsId}`)[0]) {
            const header = $(`
                <div class="claude-header">
                    <div class="claude-title">
                        <img src="https://www.anthropic.com/favicon.ico"
                             style="height: 16px; width: 16px;">
                        Claude AI Analysis
                    </div>
                    <div id="${settingsId}" class="claude-settings" title="Settings">
                        ⚙️
                    </div>
                </div>
            `);
            $(`#${RESULTS_DIV_ID} .claude-container`).append(header);
            $(`#${settingsId}`).click(() => gmc.open());
        }
    }

    function showLoading() {
        $(`#${LOADING_SPAN_ID}`).remove();
        const label = $(`
            <div id="${LOADING_SPAN_ID}" class="claude-loading">
                <div class="loading-spinner"></div>
                Getting Claude's analysis...
            </div>
        `);
        $(`#${RESULTS_DIV_ID} .claude-container`).append(label);
    }

    function hideLoading() {
        $(`#${LOADING_SPAN_ID}`).remove();
    }

    function showError(message) {
        $(`#${RESULTS_DIV_ID} .claude-container`).append(`
            <div class="claude-error">
                ${message}
                ${message.includes('API key') ?
                    '<br><br>Click the settings icon (⚙️) above to configure your API key.' :
                    ''}
            </div>
        `);
    }

    async function main() {
        try {
            setupUI();

            const params = new URLSearchParams(window.location.search);
            const query = params.get("q");

            if (!query) return;

            showLoading();
            const claudeResponse = await getClaudeResponse(query);
            hideLoading();

            $(`#${RESULTS_DIV_ID} .claude-container`).append(`
                <div class="claude-response">${claudeResponse}</div>
            `);

        } catch (error) {
            hideLoading();
            showError(error.message);
        }
    }

    // Initialize and run
    const init = new Promise((resolve) => {
        let isInit = () => setTimeout(() => (gmc.isInit ? resolve() : isInit()), 0);
        isInit();
    });

    init.then(() => {
        main();

        // Keep results on top when Google updates the page
        waitForKeyElements(SIDEBAR_SELECTOR, () => {
            $(`#${RESULTS_DIV_ID}`).prependTo(SIDEBAR_SELECTOR);
        });
    });
})();
