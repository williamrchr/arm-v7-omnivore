import {
  Button,
  Checkbox,
  Form,
  FormProps,
  Input,
  message,
  Space,
  Switch,
} from 'antd'
import 'antd/dist/antd.compact.css'
import { CheckboxValueType } from 'antd/lib/checkbox/Group'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { HStack, VStack } from '../../../components/elements/LayoutPrimitives'
import { PageMetaData } from '../../../components/patterns/PageMetaData'
import { Beta } from '../../../components/templates/Beta'
import { Header } from '../../../components/templates/settings/SettingsTable'
import { SettingsLayout } from '../../../components/templates/SettingsLayout'
import { deleteIntegrationMutation } from '../../../lib/networking/mutations/deleteIntegrationMutation'
import { setIntegrationMutation } from '../../../lib/networking/mutations/setIntegrationMutation'
import { useGetIntegrationsQuery } from '../../../lib/networking/queries/useGetIntegrationsQuery'
import { applyStoredTheme } from '../../../lib/themeUpdater'
import { showSuccessToast } from '../../../lib/toastHelpers'

type FieldType = {
  parentPageId?: string
  parentDatabaseId?: string
  enabled: boolean
  properties?: string[]
}

export default function Notion(): JSX.Element {
  applyStoredTheme()

  const router = useRouter()
  const { integrations, revalidate } = useGetIntegrationsQuery()
  const notion = useMemo(() => {
    return integrations.find((i) => i.name == 'NOTION' && i.type == 'EXPORT')
  }, [integrations])

  const [form] = Form.useForm<FieldType>()
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    form.setFieldsValue({
      parentPageId: notion?.settings?.parentPageId,
      parentDatabaseId: notion?.settings?.parentDatabaseId,
      enabled: notion?.enabled,
      properties: notion?.settings?.properties,
    })
  }, [form, notion])

  const deleteNotion = async () => {
    if (!notion) {
      throw new Error('Notion integration not found')
    }

    await deleteIntegrationMutation(notion.id)
    showSuccessToast('Notion integration disconnected successfully.')

    revalidate()
    router.push('/settings/integrations')
  }

  const updateNotion = async (values: FieldType) => {
    if (!notion) {
      throw new Error('Notion integration not found')
    }

    await setIntegrationMutation({
      id: notion.id,
      name: notion.name,
      type: notion.type,
      token: notion.token,
      enabled: values.enabled,
      settings: values,
    })
  }

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    try {
      await updateNotion(values)

      revalidate()
      messageApi.success('Notion settings updated successfully.')
    } catch (error) {
      messageApi.error('There was an error updating Notion settings.')
    }
  }

  const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (
    errorInfo
  ) => {
    console.log('Failed:', errorInfo)
  }

  const onDataChange = (value: Array<CheckboxValueType>) => {
    form.setFieldsValue({ properties: value.map((v) => v.toString()) })
  }

  return (
    <>
      {contextHolder}
      <PageMetaData title="Notion" path="/integrations/notion" />
      <SettingsLayout>
        <VStack
          css={{
            margin: '0 auto',
            width: '80%',
          }}
        >
          <HStack
            css={{
              width: '100%',
              pb: '$2',
              borderBottom: '1px solid $utilityTextDefault',
              pr: '$1',
            }}
          >
            <Image
              src="/static/icons/notion.png"
              alt="Integration Image"
              width={75}
              height={75}
            />
            <Header>Notion integration settings</Header>
            <Beta />
          </HStack>

          {notion && (
            <div style={{ width: '100%', marginTop: '40px' }}>
              <Form
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 8 }}
                labelAlign="left"
                form={form}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
              >
                <Form.Item<FieldType>
                  label="Notion Page Id"
                  name="parentPageId"
                  rules={[
                    {
                      required: true,
                      message: 'Please input your Notion Page Id!',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item<FieldType>
                  label="Notion Database Id"
                  name="parentDatabaseId"
                  hidden
                >
                  <Input disabled />
                </Form.Item>

                <Form.Item<FieldType>
                  label="Automatic Sync"
                  name="enabled"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item<FieldType>
                  label="Properties to Export"
                  name="properties"
                >
                  <Checkbox.Group onChange={onDataChange}>
                    <Checkbox value="highlights">Highlights</Checkbox>
                    <Checkbox value="labels">Labels</Checkbox>
                    <Checkbox value="notes">Notes</Checkbox>
                  </Checkbox.Group>
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      Save
                    </Button>
                    <Button type="primary" danger onClick={deleteNotion}>
                      Disconnect
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          )}
        </VStack>
      </SettingsLayout>
    </>
  )
}