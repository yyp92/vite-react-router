/**
 * * 路由缓存
 * 
 * 原理：
 *  在 context 中保存所有需要 keepalive 的组件，全部渲染出来，通过路由是否匹配来切换对应组件的显示隐藏。
 */
import { createContext, useContext } from 'react';
import { useOutlet, useLocation, matchPath } from 'react-router-dom'
import type { FC, PropsWithChildren, ReactNode } from 'react';

interface KeepAliveLayoutProps extends PropsWithChildren{
    keepPaths: Array<string | RegExp>;
    keepElements?: Record<string, ReactNode>;
    dropByPath?: (path: string) => void;
}

type KeepAliveContextType = Omit<Required<KeepAliveLayoutProps>, 'children'>;

const keepElements: KeepAliveContextType['keepElements'] = {};

// 创建一个 context
export const KeepAliveContext = createContext<KeepAliveContextType>({
    // keepPaths 是要 keepalive 的页面路径，可以是 string 也可以是正则。
    keepPaths: [],

    // keepElements 是页面路径和组件的键值对，用来保存 keepalive 的组件。
    keepElements,

    // dropByPath 是根据页面路径删除 keepElement 中的对应组件。
    dropByPath(path: string) {
        keepElements[path] = null
    }
})

// 根据是 string 还是 RegExp 分别做处理，判断路由是否在 keepPaths 内
const isKeepPath = (
    keepPaths: Array<string | RegExp>,
    path: string
) => {
    let isKeep = false

    for (let i = 0; i < keepPaths.length; i++) {
        let item = keepPaths[i]

        if (item === path) {
            isKeep = true
        }

        if (item instanceof RegExp && item.test(path)) {
            isKeep = true
        }

        if (typeof item === 'string' && item.toLowerCase() === path) {
            isKeep = true
        }
    }

    return isKeep
}

export function useKeepOutlet() {
    // useLocation 拿到当前路由
    const location = useLocation()
    // useOutlet 拿到对应的组件
    const element = useOutlet()

    const { keepElements, keepPaths } = useContext(KeepAliveContext)
    const isKeep = isKeepPath(keepPaths, location.pathname)

    // 判断下当前路由是否在需要 keepalive 的路由内，是的话就保存到 keepElements
    if (isKeep) {
        keepElements![location.pathname] = element
    }

    // 然后渲染所有的 keepElements
    return <>
        {
            Object.entries(keepElements).map(([pathname, element]) => (
                <div 
                    key={pathname}
                    style={{
                        height: '100%',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden auto'
                    }}
                    className="keep-alive-page"

                    // 如果不匹配就隐藏
                    hidden={!matchPath(location.pathname, pathname)}
                >
                    {element}
                </div>
            ))
        }

        {/* 如果当前路由不在 keepPaths 内，就直接渲染对应的组件 */}
        {!isKeep && element}
    </>
}

// 暴露出一个组件，里面用 context.Provider 修改 context 中的值，主要是设置 keepPaths，其余的都用 useContext 从 context 中取
const KeepAliveLayout: FC<KeepAliveLayoutProps> = (props) => {
    const {
        keepPaths,
        ...other
    } = props

    const {
        keepElements,
        dropByPath
    } = useContext(KeepAliveContext)

    return (
        <KeepAliveContext.Provider
            value={{
                keepPaths,
                keepElements,
                dropByPath
            }}
            {...other}
        />
    )
}

export default KeepAliveLayout
