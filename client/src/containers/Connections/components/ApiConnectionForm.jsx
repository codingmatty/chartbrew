import React, { useState, useEffect, Fragment } from "react";
import PropTypes from "prop-types";

import {
  Button, Divider, Input, Spacer,Chip, Tabs, Tab, Select, SelectItem, CircularProgress,
} from "@nextui-org/react";
import uuid from "uuid/v4";
import AceEditor from "react-ace";

import "ace-builds/src-min-noconflict/mode-json";
import "ace-builds/src-min-noconflict/theme-tomorrow";
import "ace-builds/src-min-noconflict/theme-one_dark";

import HelpBanner from "../../../components/HelpBanner";
import connectionImages from "../../../config/connectionImages";
import Container from "../../../components/Container";
import Row from "../../../components/Row";
import Text from "../../../components/Text";
import useThemeDetector from "../../../modules/useThemeDetector";
import { HiPlus, HiX } from "react-icons/hi";

const authTypes = [{
  key: "no_auth",
  text: "No auth",
  value: "no_auth",
}, {
  key: "basic_auth",
  text: "Basic auth",
  value: "basic_auth",
}, {
  key: "bearer_token",
  text: "Bearer token",
  value: "bearer_token",
}];

/*
  The Form used to create API connections
*/
function ApiConnectionForm(props) {
  const {
    editConnection, projectId, onComplete, addError, onTest, testResult,
  } = props;

  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [connection, setConnection] = useState({
    type: "api", subType: "api", optionsArray: []
  });
  const [errors, setErrors] = useState({});
  const [menuType, setMenuType] = useState("authentication");

  const isDark = useThemeDetector();
  const initRef = React.useRef(null);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      _addOption();
      _init();
    }
  }, []);

  const _init = () => {
    if (editConnection) {
      const newConnection = editConnection;
      // format the options
      if (newConnection.options && newConnection.options.length > 0) {
        const formattedOptions = [];
        for (let i = 0; i < newConnection.options.length; i++) {
          if (newConnection.options[i]) {
            formattedOptions.push({
              id: uuid(),
              key: Object.keys(newConnection.options[i])[0],
              value: newConnection.options[i][Object.keys(newConnection.options[i])[0]],
            });
          }
        }

        newConnection.optionsArray = formattedOptions;
      } else {
        newConnection.optionsArray = [];
      }

      setConnection(newConnection);
    }
  };

  const _onCreateConnection = (test = false) => {
    setErrors({});

    if (!connection.name || connection.name.length > 24) {
      setTimeout(() => {
        setErrors({ ...errors, name: "Please enter a name which is less than 24 characters" });
      }, 100);
      return;
    }
    if (!connection.host) {
      setTimeout(() => {
        setErrors({ ...errors, host: "Please enter a host name or IP address for your database" });
      }, 100);
      return;
    }

    // prepare the options
    const tempOptions = connection.optionsArray;
    const newOptions = [];
    if (tempOptions && tempOptions.length > 0) {
      for (let i = 0; i < tempOptions.length; i++) {
        if (tempOptions[i].key && tempOptions[i].value) {
          newOptions.push({ [tempOptions[i].key]: tempOptions[i].value });
        }
      }
    }

    // add the project ID
    setConnection({ ...connection, project_id: projectId, options: newOptions });

    setTimeout(() => {
      const newConnection = connection;
      if (!connection.id) newConnection.project_id = projectId;
      newConnection.options = newOptions;
      if (test === true) {
        setTestLoading(true);
        onTest(newConnection)
          .then(() => setTestLoading(false))
          .catch(() => setTestLoading(false));
      } else {
        setLoading(true);
        onComplete(newConnection)
          .then(() => setLoading(false))
          .catch(() => setLoading(false));
      }
    }, 100);
  };

  const _addOption = () => {
    const option = {
      id: uuid(),
      key: "",
      value: "",
    };

    setConnection({ ...connection, optionsArray: [...connection.optionsArray, option] });
  };

  const _removeOption = (id) => {
    const tempOptions = connection.optionsArray;
    const newOptions = [];
    for (let i = 0; i < tempOptions.length; i++) {
      if (tempOptions[i].id !== id) {
        newOptions.push(tempOptions[i]);
      }
    }

    setConnection({ ...connection, optionsArray: newOptions });
  };

  const _onChangeOption = (id, value, selector) => {
    const tempOptions = connection.optionsArray;
    for (let i = 0; i < tempOptions.length; i++) {
      if (tempOptions[i].id === id) {
        if (tempOptions[i][selector]) tempOptions[i][selector] = "";
        tempOptions[i][selector] = value;
      }
    }

    setConnection({ ...connection, optionsArray: tempOptions });
  };

  const _onChangeAuthParams = (type, value) => {
    const auth = connection.authentication || {};
    auth[type] = value;
    
    setConnection({ ...connection, authentication: auth });
  };

  return (
    <div className="p-unit-lg bg-content1 shadow-md border-1 border-solid border-content3 rounded-lg">
      <div>
        <Row align="center">
          <Text size="lg" b>
            {!editConnection && "Add a new API host"}
            {editConnection && `Edit ${editConnection.name}`}
          </Text>
        </Row>
        <Spacer y={4} />
        <Row>
          <HelpBanner
            title="Learn how to visualize your API data with Chartbrew"
            description="Chartbrew can connect to your API data and create charts that tell you more about your data."
            url={"https://chartbrew.com/blog/how-to-visualize-simple-analytics-data-with-chartbrew/"}
            imageUrl={connectionImages(isDark).api}
            info="5 min read"
          />
        </Row>
        <Spacer y={8} />
        <Row className={"gap-4"}>
          <Input
            label="Enter a name for your connection"
            placeholder="Enter a name you can recognize later"
            value={connection.name || ""}
            onChange={(e) => {
              setConnection({ ...connection, name: e.target.value });
            }}
            color={errors.name ? "error" : "default"}
            fullWidth
            variant="bordered"
            description={errors.name}
          />

          <Input
            label="The hostname of your API"
            placeholder="https://api.example.com"
            value={connection.host || ""}
            onChange={(e) => {
              setConnection({ ...connection, host: e.target.value });
            }}
            fullWidth
            color={errors.host ? "error" : "default"}
            variant="bordered"
            description={errors.host}
          />
        </Row>
        <Spacer y={4} />

        <Tabs selectedKey={menuType} onSelectionChange={(key) => setMenuType(key)}>
          <Tab key="authentication" title="Authentication" />
          <Tab key="headers" title="Headers" />
        </Tabs>
        <Spacer y={4} />
        <Divider />
        <Spacer y={4} />

        {menuType === "authentication" && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 sm:col-span-12 md:col-span-4 lg:col-span-4 xl:col-span-4">
              <Row>
                <Select
                  label="Authentication type"
                  placeholder="Select an authentication type"
                  defaultValue="no_auth"
                  selectedKeys={[connection?.authentication?.type]}
                  onSelectionChange={(keys) => _onChangeAuthParams("type", keys?.currentKey)}
                  selectionMode="single"
                  variant="bordered"
                >
                  {authTypes.map((type) => (
                    <SelectItem key={type.value}>
                      {type.text}
                    </SelectItem>
                  ))}
                </Select>
              </Row>
            </div>
            {connection.authentication && connection.authentication.type === "basic_auth" && (
              <div className="col-span-12 sm:col-span-12 md:col-span-5 lg:col-span-5 xl:col-span-5">
                <Row align="center">
                  <Input
                    label="Enter a Username or API Key"
                    placeholder="Username or API Key"
                    onChange={(e) => _onChangeAuthParams("user", e.target.value)}
                    value={connection.authentication.user}
                    fullWidth
                    variant="bordered"
                  />
                </Row>
                <Spacer y={2} />
                <Row align="center">
                  <Input
                    type="password"
                    label="Enter a Password or API Key Value"
                    placeholder="Password or API Key Value"
                    onChange={(e) => _onChangeAuthParams("pass", e.target.value)}
                    value={connection.authentication.pass}
                    fullWidth
                    variant="bordered"
                  />
                </Row>
              </div>
            )}
            {connection.authentication && connection.authentication.type === "bearer_token" && (
              <div className="col-span-12 sm:col-span-12 md:col-span-5 lg:col-span-5 xl:col-span-5">
                <Input
                  type="password"
                  label="Enter the token"
                  placeholder="Authentication token"
                  onChange={(e) => _onChangeAuthParams("token", e.target.value)}
                  value={connection.authentication.token}
                  fullWidth
                  variant="bordered"
                />
              </div>
            )}
          </div>
        )}
        <Spacer y={4} />

        {menuType === "headers" && (
          <>
            <Row>
              <Text b>
                Global headers to send with the requests
              </Text>
            </Row>
            <Row>
              <Text>
                {"These headers will be included with all the future requests"}
              </Text>
            </Row>
            <Spacer y={2} />
          </>
        )}

        {menuType === "headers" && connection.optionsArray && connection.optionsArray.map((option) => {
          return (
            <Fragment key={option.id}>
              <Row className={"gap-4"}>
                <Input
                  placeholder="Header name"
                  value={option.key}
                  onChange={(e) => _onChangeOption(option.id, e.target.value, "key")}
                  fullWidth
                />
                <Input
                  onChange={(e) => _onChangeOption(option.id, e.target.value, "value")}
                  value={option.value}
                  placeholder="Value"
                  fullWidth
                />
                <Button
                  isIconOnly
                  onClick={() => _removeOption(option.id)}
                  variant="faded"
                  color="secondary"
                >
                  <HiX />
                </Button>
              </Row>
              <Spacer y={2} />
            </Fragment>
          );
        })}

        {menuType === "headers" && (
          <>
            <Spacer y={2} />
            <Button
              endContent={<HiPlus />}
              onClick={_addOption}
              variant="bordered"
            >
              Add a header
            </Button>
            <Spacer y={4} />
          </>
        )}

        {addError && (
          <>
            <Spacer y={4} />
            <Row>
              <Text b className="text-danger">{"Server error while trying to save your connection"}</Text>
              <br />
              <Text className="text-danger">Please try adding your connection again.</Text>
            </Row>
          </>
        )}

        <Spacer y={4} />
        <Row align="center">
          <Button
            variant="ghost"
            onClick={() => _onCreateConnection(true)}
            isLoading={testLoading}
            auto
          >
            {"Test connection"}
          </Button>
          <Spacer x={1} />
          {!editConnection && (
            <Button
              isLoading={loading}
              onClick={_onCreateConnection}
              color="primary"
            >
              {"Save connection"}
            </Button>
          )}
          {editConnection && (
            <Button
              isLoading={loading}
              onClick={_onCreateConnection}
              color="primary"
            >
              {"Save changes"}
            </Button>
          )}
        </Row>
      </div>
      <Spacer y={4} />

      {testLoading && (
        <Container size="md" className={"bg-content2"}>
          <Row align="center">
            <CircularProgress aria-label="Loading" />
          </Row>
          <Spacer y={4} />
        </Container>
      )}

      {testResult && !testLoading && (
        <Container className={"bg-content2"} size="md">
          <Row align="center">
            <Text>
              {"Test Result "}
              <Chip
                color={testResult.status < 400 ? "success" : "danger"}
              >
                {`Status code: ${testResult.status}`}
              </Chip>
            </Text>
          </Row>
          <Spacer y={4} />
          <AceEditor
            mode="json"
            theme={isDark ? "one_dark" : "tomorrow"}
            style={{ borderRadius: 10 }}
            height="150px"
            width="none"
            value={testResult.body || "Hello"}
            readOnly
            name="queryEditor"
            editorProps={{ $blockScrolling: true }}
          />
        </Container>
      )}
    </div>
  );
}

ApiConnectionForm.defaultProps = {
  editConnection: null,
  addError: null,
  testResult: null,
};

ApiConnectionForm.propTypes = {
  onComplete: PropTypes.func.isRequired,
  onTest: PropTypes.func.isRequired,
  projectId: PropTypes.string.isRequired,
  editConnection: PropTypes.object,
  addError: PropTypes.bool,
  testResult: PropTypes.object,
};

export default ApiConnectionForm;