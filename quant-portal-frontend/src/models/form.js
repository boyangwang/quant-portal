import { routerRedux } from 'dva/router';
import { message } from 'antd';
import { fakeSubmitForm } from '../services/api';

const getTickerList = payload => {
  let postData = [];
  if (payload.ticker) {
    postData.push(payload.ticker);
  } else if (payload.tickers) {
    postData = postData.concat(
      ...payload.tickers
        .split('\n')
        .map(t => t.trim())
        .filter(t => t !== '')
    );
  }
  return postData.map(t => t.toUpperCase());
};

const getNeedRequestTickers = (tickers, results) => {
  return tickers.filter(t => !results[t]);
};

export default {
  namespace: 'form',

  state: {
    ticker2cusip: {
      results: {},
      currentResults: {},
    },
    step: {
      payAccount: 'ant-design@alipay.com',
      receiverAccount: 'test@example.com',
      receiverName: 'Alex',
      amount: '500',
    },
  },

  effects: {
    *submitRegularForm({ payload }, { call, put, select }) {
      const tickerList = getTickerList(payload);
      if (tickerList.length === 0) {
        message.warn('No ticker provided');
      }

      const oldResults = yield select(state => state.form.ticker2cusip.results);
      const needRequestTickers = getNeedRequestTickers(tickerList, oldResults);
      let newResults = {};
      if (needRequestTickers.length !== 0) {
        newResults = yield call(fakeSubmitForm, needRequestTickers);
        newResults = newResults.data;
      }
      const mergedResults = {
        ...oldResults,
        ...newResults,
      };

      const currentResults = {};
      tickerList.forEach(t => {
        currentResults[t] = mergedResults[t];
      });

      yield put({
        type: 'saveConversionResults',
        payload: { results: mergedResults, currentResults },
      });
      message.info('Received conversion result');
    },
    *submitStepForm({ payload }, { call, put }) {
      yield call(fakeSubmitForm, payload);
      yield put({
        type: 'saveStepFormData',
        payload,
      });
      yield put(routerRedux.push('/form/step-form/result'));
    },
    *submitAdvancedForm({ payload }, { call }) {
      yield call(fakeSubmitForm, payload);
      message.success('提交成功');
    },
  },

  reducers: {
    saveStepFormData(state, { payload }) {
      return {
        ...state,
        step: {
          ...state.step,
          ...payload,
        },
      };
    },
    saveConversionResults(state, { payload }) {
      return {
        ...state,
        ticker2cusip: {
          results: payload.results,
          currentResults: payload.currentResults,
        },
      };
    },
  },
};
