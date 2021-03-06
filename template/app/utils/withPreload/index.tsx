import React, { Component } from 'react';
import Loading from 'components/Loading';
import ErrorBox from 'components/ErrorBox';
import './style.scss';

type ILoader = () => Promise<any>;

interface IConfig {
    prop?: string;
    filter?(data: any): any;
}

interface IState {
    loading: boolean;
    error: Error | null;
    data: any;
}

/**
 * @description
 * 快速创建请求回调式的高阶组件
 * // === withUserinfo.ts
 * const withUserinfo = withPreload(() => http.get('/api/v1/userinfo'));
 *
 * // === App.tsx
 * @withUserinfo
 * class App extends React.Component {
 *      render() {
 *          // this.props.preload 即可访问获取的数据
 *      }
 * }
 *
 * ***************************************************************************
 * 注意，在调用withPreload时，可以通过第二个参数config配置需要传递过滤器和传递给子组件的prop名字。
 * 如果自定义了prop名字，则需要在调用时指明prop的类型名，用来告诉编译器理解这一变动：
 * withPreload<'custom'>(() => http.get('/api'), {
 *      prop: 'custom'
 * });
 *
 * 另外还可以通过filer参数来过滤返回值：
 * withPreload(() => http.get('/api'), {
 *      filter(resp) {
 *          return resp.data.map(item => item.value);
 *      }
 * });
 */
export default function createWithPreload<T = 'preload'>(loader: ILoader, config: IConfig = {}) {
    return function withPreload<Self = {}>(
        WrappedComponent: React.ComponentType<Self>
    ): React.ComponentClass<Omit<Self, T>> {
        return class extends Component<Self, IState> {
            static displayName = 'WithPreload-' + (WrappedComponent.displayName || WrappedComponent.name);

            readonly state = {
                loading: true,
                error: null,
                data: null
            };

            componentDidMount() {
                this.getData();
            }

            getData = async () => {
                this.setState({
                    loading: true
                });

                try {
                    const data = await loader();

                    this.setState({
                        data: config.filter ? config.filter(data) : data
                    });
                } catch (error) {
                    this.setState({
                        error
                    });
                }

                this.setState({
                    loading: false
                });
            };

            render() {
                const { loading, error, data } = this.state;

                if (loading) {
                    return (
                        <div className="with-preload-container">
                            <Loading label="loading.." />
                        </div>
                    );
                }

                if (error) {
                    return (
                        <div className="with-preload-container">
                            <ErrorBox error={error} onClick={this.getData} />
                        </div>
                    );
                }

                const injectProps = {
                    [config.prop || 'preload']: data
                };

                return <WrappedComponent {...this.props} {...injectProps} />;
            }
        };
    };
}
