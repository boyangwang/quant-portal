import React, { PureComponent } from 'react';
import { connect } from 'dva';
import {
  Row,
  Col,
  Table,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Card,
  InputNumber,
  Radio,
  Icon,
  Tooltip,
  Upload,
  message,
} from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import styles from './style.less';

const FormItem = Form.Item;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const handleFileSubmit = (tickers, dispatch, onSuccess) => {
  dispatch({
    type: 'form/submitRegularForm',
    payload: { tickers },
  }).then(() => {
    onSuccess();
  });
};
const handleSubmit = function handleSubmit(e) {
  e.preventDefault();
  this.props.form.validateFieldsAndScroll((err, values) => {
    if (!err) {
      this.props.dispatch({
        type: 'form/submitRegularForm',
        payload: values,
      });
    }
  });
};
const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 10 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 12 },
    md: { span: 12 },
  },
};
const submitFormLayout = {
  wrapperCol: {
    xs: { span: 24, offset: 0 },
    sm: { span: 12, offset: 10 },
  },
};

@connect(({ form, loading }) => ({
  submitting: loading.effects['form/submitRegularForm'],
}))
@Form.create()
class SingleTickerForm extends PureComponent {
  render() {
    const { submitting } = this.props;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    return (
      <Card>
        <Form onSubmit={handleSubmit.bind(this)} hideRequiredMark style={{ marginTop: 8 }}>
          <FormItem {...formItemLayout} label="Bloomberg ticker">
            {getFieldDecorator('ticker', {
              rules: [
                {
                  required: true,
                  message: "Ticker can't be empty",
                },
              ],
            })(<Input placeholder="e.g. AIH8 Index, C Z7 Comdty, LAZ18 Comdty..." />)}
          </FormItem>
          <FormItem {...submitFormLayout} style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Convert
            </Button>
          </FormItem>
        </Form>
      </Card>
    );
  }
}

@connect(({ loading }) => ({
  submitting: loading.effects['form/submitRegularForm'],
}))
@Form.create()
class MultipleTickerForm extends PureComponent {
  render() {
    const { submitting } = this.props;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    return (
      <Card>
        <Form onSubmit={handleSubmit.bind(this)} hideRequiredMark style={{ marginTop: 8 }}>
          <FormItem {...formItemLayout} label="Multiple tickers">
            {getFieldDecorator('tickers', {
              rules: [
                {
                  required: true,
                  message: "Tickers can't be empty",
                },
              ],
            })(
              <TextArea
                style={{ minHeight: 32 }}
                placeholder="Input tickers one per line"
                rows={4}
              />
            )}
          </FormItem>
          <FormItem {...submitFormLayout} style={{ marginTop: 8 }}>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Convert
            </Button>
          </FormItem>
        </Form>
      </Card>
    );
  }
}

@connect(({ loading }) => ({
  submitting: loading.effects['form/submitRegularForm'],
}))
@Form.create()
class FileForm extends PureComponent {
  render() {
    const { submitting, dispatch } = this.props;
    const { getFieldDecorator, getFieldValue } = this.props.form;
    return (
      <Card>
        <Form onSubmit={this.handleSubmit} hideRequiredMark style={{ marginTop: 8 }}>
          <FormItem
            {...formItemLayout}
            label={<span>Flat file containing one ticker per line</span>}
          >
            <Upload
              name="tickers"
              customRequest={uploadObject => {
                const reader = new FileReader();
                reader.onload = () => {
                  uploadObject.onProgress({ percent: 30 });
                  handleFileSubmit(reader.result, dispatch, uploadObject.onSuccess);
                };
                reader.readAsText(uploadObject.file);
              }}
              onChange={info => {
                if (info.file.status === 'done') {
                  message.info(`${info.file.name} uploaded`);
                } else if (info.file.status === 'error') {
                  message.error(`${info.file.name} file upload failed.`);
                }
              }}
            >
              <Button type="primary">
                <Icon type="upload" /> Click to upload and convert
              </Button>
            </Upload>
          </FormItem>
        </Form>
      </Card>
    );
  }
}

const getTableDataSourceFromFormData = (formData, allHistory) => {
  const dataSource = [];
  let tickers;
  if (allHistory) {
    tickers = Object.keys(formData.results).sort();
  } else {
    tickers = Object.keys(formData.currentResults).sort();
  }
  for (const ticker of tickers) {
    dataSource.push({
      key: ticker,
      ticker,
      cusip: formData.results[ticker],
    });
  }
  return dataSource;
};

@connect(({ form, loading }) => ({
  formData: form.ticker2cusip,
}))
export default class BasicForms extends PureComponent {
  columns = [
    {
      title: 'Bloomberg ticker',
      dataIndex: 'ticker',
      key: 'ticker',
    },
    {
      title: 'CUSIP',
      dataIndex: 'cusip',
      key: 'cusip',
    },
  ];

  render() {
    const { formData } = this.props;
    const dataSource = getTableDataSourceFromFormData(formData);
    const allHistoricalDataSource = getTableDataSourceFromFormData(formData, true);

    return (
      <PageHeaderLayout
        title="Converter"
        content="Single ticker, multiple tickers, or tickers stored in a flat file"
      >
        <Row type="flex" justify="space-between" style={{ alignItems: 'stretch' }}>
          <Col span="12">
            <SingleTickerForm />
            <MultipleTickerForm />
            <FileForm />
          </Col>
          <Col span="11">
            <Card title="Current convert results">
              <Table
                dataSource={dataSource}
                columns={this.columns}
                pagination={false}
                size="small"
              />
            </Card>
            <Card title="All historical convert results">
              <Table dataSource={allHistoricalDataSource} columns={this.columns} size="small" />
            </Card>
          </Col>
        </Row>
      </PageHeaderLayout>
    );
  }
}
