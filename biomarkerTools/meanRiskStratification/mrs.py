# We need to import the jsonify object, it will let us
# output json, and it will take care of the right string
# data conversion, the headers for the response, etc
import json
from flask import Flask, render_template, request, jsonify
import rpy2.robjects as robjects
from rpy2.robjects.vectors import IntVector
from socket import gethostname

r_mrs_env = robjects.globalenv['MRS']
r_getJSON_abcd = r_mrs_env['getJSON_abcd']
r_getJSON_PPVNPVprobM = r_mrs_env['getJSON_PPVNPVprobM']
r_getJSON_PPVNPVprobD = r_mrs_env['getJSON_PPVNPVprobD']
r_getJSON_sensspecprobM = r_mrs_env['getJSON_sensspecprobM']
r_getJSON_sensspecprobD = r_mrs_env['getJSON_sensspecprobD']

# Number Needed to Test: invalid when MRS is zero (division by 2/MRS) or CI bound is zero.
MRS_NNT_ERROR_MSG = (
    "For this 2\u00d72 table, Mean Risk Stratification is zero, so "
    "Number Needed to Test is not defined. Enter different cell counts."
)
MRS_NNT_GENERIC_MSG = (
    "Number Needed to Test could not be calculated for this input. "
    "Try different cell counts or parameters."
)

# Initialize the Flask application
app = Flask(__name__)

@app.route('/')
def index():
    # Render template
    return render_template('index.html')

# This route will return a list in JSON format
@app.route('/mrsRest/', methods=['POST'])
def mrsRest():
    # Get the parsed contents of the form data
    data = request.json
    biomar = {}
    i = 1
    for currData in data:
        if data[currData]['option'] == 1:
            a = data[currData]['a']
            b = data[currData]['b']
            c = data[currData]['c']
            d = data[currData]['d']

            abcd = []
            abcd.append(a)
            abcd.append(b)
            abcd.append(c)
            abcd.append(d)

            fromR = (r_getJSON_abcd(IntVector(abcd)))
            fromRlist = list(fromR)
            fromRstr = ''.join(fromRlist)

            biomar[currData] = json.loads(fromRstr)
        elif data[currData]['option'] == 2:
            # if for example prob_m is not defind in the UI
            # then data[currData]['prob_m'] will throw a KeyError
            # when attempting to store the value to a reference variable (probM)
            # do a brute force check for all possible values that are not null (not None)

            # set variables to NULL (None) instead of a value because
            # further below we check for None
            ppv = None
            npv = None
            total = None
            sens = None
            spec = None
            probM = None
            probD = None

            # save value to variable for all given keys
            for key in list(data[currData].keys()):
                if key == 'ppv':
                    ppv = data[currData]['ppv']
                if key == 'npv':
                    npv = data[currData]['npv']
                if key == 'sampsize':
                    total = data[currData]['sampsize']
                if key == 'sens':
                    sens = data[currData]['sens']
                if key == 'spec':
                    spec = data[currData]['spec']
                if key == 'prob_m':
                    probM = data[currData]['prob_m']
                if key == 'prob_d':
                    probD = data[currData]['prob_d']
            if ppv is not None:
                if npv is not None:
                    # probM != NULL && probD == NULL
                    if probM is not None and probD is None:
                        fromR = (r_getJSON_PPVNPVprobM(
                            float(ppv),
                            float(npv),
                            float(probM),
                            int(total)))
                        fromRlist = list(fromR)
                        fromRstr = ''.join(fromRlist)
                        # using json.loads
                        biomar[currData] = json.loads(fromRstr)
                    # probD != NULL && probM == NULL
                    elif probD is not None and probM is None:
                        fromR = (r_getJSON_PPVNPVprobD(
                            float(ppv),
                            float(npv),
                            float(probD),
                            int(total)))
                        fromRlist = list(fromR)
                        fromRstr = ''.join(fromRlist)
                        biomar[currData] = json.loads(fromRstr)

            elif sens is not None:
                if spec is not None:
                    if probM is not None and probD is None:
                        fromR = (r_getJSON_sensspecprobM(float(sens),float(spec),float(probM),int(total)))
                        fromRlist = list(fromR)
                        fromRstr = ''.join(fromRlist)
                        biomar[currData] = json.loads(fromRstr)
                    elif probD is not None and probM is None:
                        fromR = (r_getJSON_sensspecprobD(float(sens),float(spec),float(probD),int(total)))
                        fromRlist = list(fromR)
                        fromRstr = ''.join(fromRlist)
                        biomar[currData] = json.loads(fromRstr)

    # NCIATWP-864: add "Number Needed to Test (nnt)"
    for key in biomar:
        mean_risk_stratification = biomar[key]['calculations']['Mean Risk Stratification']
        mrs = mean_risk_stratification['Value']
        ci_lo = mean_risk_stratification['Confidence Interval (lower bound)']
        ci_hi = mean_risk_stratification['Confidence Interval (upper bound)']
        value = 0.01 * mrs
        lower_bound = 0.01 * ci_lo
        upper_bound = 0.01 * ci_hi
        if value == 0 or lower_bound == 0 or upper_bound == 0:
            return jsonify({'error': MRS_NNT_ERROR_MSG}), 400
        try:
            bounds = [2 / lower_bound, 2 / upper_bound]
            biomar[key]['calculations']['Number Needed to Test'] = {
                'Value': round(2 / value),
                'Confidence Interval (lower bound)': round(min(bounds)),
                'Confidence Interval (upper bound)': round(max(bounds)),
            }
        except ZeroDivisionError:
            return jsonify({'error': MRS_NNT_GENERIC_MSG}), 400

    return json.dumps(biomar)

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("-p", dest="port_number", default="9982", help="Sets the Port")
    parser.add_argument("--debug", action="store_true")
    # Default port is production value; prod,stage,dev = 9982, sandbox=9983
    args = parser.parse_args()
    port_num = int(args.port_number);

    hostname = gethostname()
    app.run(host='0.0.0.0', port=port_num, debug = args.debug, use_evalex = False)
