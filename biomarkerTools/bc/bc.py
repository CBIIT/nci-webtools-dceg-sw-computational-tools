#!flask/bin/python
from flask import Flask, render_template, Response, abort, request, make_response, url_for, jsonify
from functools import wraps
from flask import current_app
from rpy2.robjects import r
from socket import gethostname
import json

app = Flask(__name__, static_folder='', static_url_path='/')
#app = Flask(__name__, static_folder='static', static_url_path='/static')

@app.route('/')
def index():
    return render_template('../index.html')

def jsonp(func):
    """Wraps JSONified output for JSONP requests."""
    @wraps(func)
    def decorated_function(*args, **kwargs):
        callback = request.args.get('callback', False)
        if callback:
            #data = str(func(*args, **kwargs).data)
            #content = str(callback) + '(' + data + ')'
            #mimetype = 'application/javascript'
            mimetype = 'application/json'
            content=func(*args, **kwargs).data
            return current_app.response_class(content, mimetype=mimetype)
        else:
            return func(*args, **kwargs)
    return decorated_function

@app.route('/bcRest/', methods = ['GET','POST'])
@jsonp
def call_bc_RFunction():
    thestream=request.stream.read()
    print(" input stream "+str(thestream))
    jsondata = r['BC']['getDataJSON'](thestream.decode())[0]
    print("json string >> "+str(jsondata))
    return jsondata

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
