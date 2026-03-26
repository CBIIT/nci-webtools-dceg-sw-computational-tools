requirejs.config({
    paths: {
        help: 'help/help',
        bc: 'bc/bc',
        meanstorisk: 'meanstorisk/meanstorisk',
        riskStratAdvanced: 'riskStratAdvanced/riskStratAdv',
        meanRiskStratification: 'meanRiskStratification/mrs',
        main: 'main',
    },
});

var allowedInitialModules = {
        bc: true,
        meanstorisk: true,
        riskStratAdvanced: true,
        meanRiskStratification: true,
        help: true,
};

function getSafeInitialModuleFromHash(rawHash) {
        if (typeof rawHash !== 'string') {
                return null;
        }
        var normalized = rawHash.replace(/^#/, '').trim();
        if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(normalized)) {
                return null;
        }
        return allowedInitialModules[normalized] ? normalized : null;
}

require(['main'], function(){
    console.log("default scripts loaded");
        var activeTab = $('[role="tab"].active a').get(0);
        if (!activeTab || !activeTab.hash) {
            return {};
        }
        var id = getSafeInitialModuleFromHash(activeTab.hash);
        if (id && id !== 'home') {
            require([id]);
    }
    return {};
});
