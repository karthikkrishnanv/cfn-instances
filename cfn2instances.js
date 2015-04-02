/*
 * Given a CFN template name, list all the ec2s spawned
 * Assumes aws cli has been installed and configured already
 * Usage: node  cfn2instances.js  AWS-Stack-Name
 */

var child_process = require('child_process');
var path = require('path');
var traverse = require('traverse');



var scriptName = path.basename(__filename);
var args = [];
var ec2 = [];
var cmd,cfnOut;

process.argv.forEach(function (val, index, array) {
  args[index] = val;
});

if (args.length != 3) {
  console.log("Usage: node " + scriptName + " StackName");
  process.exit(1);
}

cmd = "aws cloudformation describe-stack-resources  --stack-name " + args[2];
try {
  cfnOut = child_process.execSync(cmd, { encoding: 'utf8' });
  cfnOut = JSON.parse(cfnOut);
}
catch (e) {
  //console.log(e);
  console.log("Error! Is the stack " + args[2] + " valid?");
  process.exit(0);
}

function findIP(instance) {
  var cmd = "aws ec2 describe-instances --instance-ids " + instance;
  var cfnOut = child_process.execSync(cmd, { encoding: 'utf8' });
  var cfnOut = JSON.parse(cfnOut);
  var json = {};
  traverse(cfnOut).forEach(function (x) {
    if (this.isLeaf && this.parent != undefined) {
      if (this.parent.node.hasOwnProperty("InstanceId")) {
          if (this.parent.node.InstanceId == instance) {
            json.PublicIpAddress = this.parent.node.PublicIpAddress;
            json.PrivateIpAddress = this.parent.node.PrivateIpAddress;

          }
      }
    }
  });
  return json;
}

for (idx in cfnOut.StackResources) {
  var val = cfnOut.StackResources[idx];
  if (val.ResourceType === "AWS::EC2::Instance") {
    var json = {};
    json.LogicalResourceId = val.LogicalResourceId;
    json.PhysicalResourceId = val.PhysicalResourceId;
    json.IP = findIP(json.PhysicalResourceId);
    ec2.push(json);
  }
}

console.log(ec2);
