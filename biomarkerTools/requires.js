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

require(['main'], function(){
    console.log("default scripts loaded");
    var id = $('[role="tab"].active a')[0].hash.replace('#','');
    if (id != 'home') {
      require([ id ]);
    }
    return {};
});
